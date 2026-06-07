import { create } from 'zustand';
import { db, auth } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { format } from 'date-fns';
import { useDemoStore } from './useDemoStore';
import { useAuditLogStore } from './useAuditLogStore';

const normalizeCustomerText = (value) => String(value || '').trim().toLowerCase();
const normalizeCustomerPhone = (value) => String(value || '').replace(/\D/g, '');

const getBookingPhone = (bookingData = {}) => (
  bookingData.phone ||
  bookingData.clientPhone ||
  bookingData.customerPhone ||
  bookingData.whatsapp ||
  bookingData.wa ||
  ''
);

const getBookingTotal = (bookingData = {}) => Number(
  bookingData.totalPrice ||
  bookingData.estimatedPrice ||
  bookingData.price ||
  0
);

const buildCustomerMetadataPatch = (bookingData = {}) => {
  const cleanText = (value) => String(value || '').trim();
  const clientUid = cleanText(bookingData.clientUid);
  const clientEmail = normalizeCustomerText(bookingData.clientEmail || bookingData.email || '');
  const linkedCustomerId = cleanText(bookingData.linkedCustomerId);

  return {
    ...(clientUid ? { clientUid } : {}),
    ...(clientEmail ? { clientEmail } : {}),
    ...(bookingData.clientName ? { clientName: bookingData.clientName } : {}),
    ...(linkedCustomerId ? { linkedCustomerId } : {}),
    ...(bookingData.sourceRequestId ? { sourceRequestId: bookingData.sourceRequestId } : {}),
    ...(bookingData.createdBy ? { createdBy: bookingData.createdBy } : {}),
    ...(cleanText(bookingData.projectName) ? { projectName: cleanText(bookingData.projectName) } : {}),
    ...(cleanText(bookingData.clientType) ? { clientType: cleanText(bookingData.clientType) } : {}),
    ...(cleanText(bookingData.primaryGenre) ? { primaryGenre: cleanText(bookingData.primaryGenre) } : {}),
    ...(cleanText(bookingData.mainNeed) ? { mainNeed: cleanText(bookingData.mainNeed) } : {}),
    ...(cleanText(bookingData.memberCount) ? { memberCount: cleanText(bookingData.memberCount) } : {}),
    ...(cleanText(bookingData.preferredDuration) ? { preferredDuration: cleanText(bookingData.preferredDuration) } : {}),
    ...(cleanText(bookingData.preferredTime) ? { preferredTime: cleanText(bookingData.preferredTime) } : {}),
    ...(cleanText(bookingData.preferredDays) ? { preferredDays: cleanText(bookingData.preferredDays) } : {}),
    ...(cleanText(bookingData.socialLink) ? { socialLink: cleanText(bookingData.socialLink) } : {}),
    ...(cleanText(bookingData.gearNotes) ? { gearNotes: cleanText(bookingData.gearNotes) } : {}),
    ...(cleanText(bookingData.invoiceName) ? { invoiceName: cleanText(bookingData.invoiceName) } : {}),
    ...(cleanText(bookingData.paymentPreference) ? { paymentPreference: cleanText(bookingData.paymentPreference) } : {}),
    ...(cleanText(bookingData.clientLevel) ? { clientLevel: cleanText(bookingData.clientLevel) } : {}),
  };
};
const findMatchingCustomer = (customers, name, bookingData = {}) => {
  const normalizedName = normalizeCustomerText(name || bookingData.clientName || bookingData.band);
  const bookingPhone = normalizeCustomerPhone(getBookingPhone(bookingData));
  const clientUid = String(bookingData.clientUid || '').trim();
  const clientEmail = normalizeCustomerText(bookingData.clientEmail || bookingData.email || '');
  const linkedCustomerId = String(bookingData.linkedCustomerId || '').trim();

  return customers.find((candidate) => {
    const candidateId = String(candidate.id || '').trim();
    const candidateUid = String(candidate.clientUid || '').trim();
    const candidateEmail = normalizeCustomerText(candidate.clientEmail || candidate.email || '');
    const candidatePhone = normalizeCustomerPhone(candidate.phone || candidate.clientPhone || candidate.whatsapp || candidate.wa || '');
    const candidateName = normalizeCustomerText(candidate.name || candidate.clientName);

    if (linkedCustomerId && candidateId === linkedCustomerId) return true;
    if (clientUid && candidateUid === clientUid) return true;
    if (clientEmail && candidateEmail === clientEmail) return true;
    if (bookingPhone && candidatePhone === bookingPhone) return true;
    if (normalizedName && candidateName === normalizedName) return true;

    return false;
  });
};

export const useCustomerStore = create((set, get) => {
  const customersRef = collection(db, 'customers');
  let realCustomers = [];
  let unsubscribeCustomers = null;

  onAuthStateChanged(auth, (user) => {
    if (unsubscribeCustomers) {
      unsubscribeCustomers();
      unsubscribeCustomers = null;
    }

    if (!user || user.isAnonymous) {
      realCustomers = [];
      set({ customers: [], isLoaded: true, error: null });
      return;
    }

    unsubscribeCustomers = onSnapshot(customersRef, (snapshot) => {
      realCustomers = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: data.id ?? docSnap.id,
          ...data,
        };
      });

      if (!useDemoStore.getState().isDemoMode) {
        set({ customers: realCustomers, isLoaded: true, error: null });
      } else {
        set({ isLoaded: true, error: null });
      }
    }, (error) => {
      console.error('Error loading customers:', error);
      set({ customers: [], isLoaded: true, error: error.message });
    });
  });

  useDemoStore.subscribe((demoState) => {
    if (demoState.isDemoMode) {
      set({ customers: demoState.demoCustomers, isLoaded: true });
    } else {
      set({ customers: realCustomers, isLoaded: true });
    }
  });

  return {
    customers: [],
    isLoaded: false,
    error: null,

    addCustomer: async (newCustomer) => {
      const id = Date.now();
      const customerData = {
        ...newCustomer,
        id,
        joinDate: newCustomer.joinDate || format(new Date(), 'yyyy-MM-dd'),
        totalBookings: Number(newCustomer.totalBookings || 0),
        totalHours: Number(newCustomer.totalHours || 0),
        totalSpent: Number(newCustomer.totalSpent || 0),
        lastBooking: newCustomer.lastBooking || '-',
      };

      set((state) => ({ customers: [...state.customers, customerData] }));

      if (useDemoStore.getState().isDemoMode) return customerData;

      await setDoc(doc(customersRef, id.toString()), customerData);
      await useAuditLogStore.getState().addLog({
        action: 'customer_create',
        entityType: 'customer',
        entityId: id,
        summary: 'Pelanggan ' + customerData.name + ' ditambahkan',
        metadata: customerData,
      });

      return customerData;
    },

    updateCustomer: async (id, updatedData) => {
      set((state) => ({
        customers: state.customers.map((customer) => (
          customer.id === id ? { ...customer, ...updatedData } : customer
        )),
      }));

      if (useDemoStore.getState().isDemoMode) return;

      await updateDoc(doc(customersRef, id.toString()), updatedData);
      await useAuditLogStore.getState().addLog({
        action: 'customer_update',
        entityType: 'customer',
        entityId: id,
        summary: 'Data pelanggan diperbarui',
        metadata: updatedData,
      });
    },

    deleteCustomer: async (id) => {
      set((state) => ({ customers: state.customers.filter((customer) => customer.id !== id) }));

      if (useDemoStore.getState().isDemoMode) return;

      await deleteDoc(doc(customersRef, id.toString()));
      await useAuditLogStore.getState().addLog({
        action: 'customer_delete',
        entityType: 'customer',
        entityId: id,
        summary: 'Pelanggan dihapus',
      });
    },

    incrementBookingCount: async (name, bookingData = {}) => {
      const state = get();
      const cleanName = String(name || bookingData.clientName || bookingData.band || 'Pelanggan Baru').trim();
      const bookingPhone = getBookingPhone(bookingData);
      const bookingPhoneDigits = normalizeCustomerPhone(bookingPhone);
      const clientEmail = normalizeCustomerText(bookingData.clientEmail || bookingData.email || '');
      const totalPrice = getBookingTotal(bookingData);
      const duration = Number(bookingData.duration || 0);
      const metadataPatch = buildCustomerMetadataPatch(bookingData);
      const customer = findMatchingCustomer(state.customers, cleanName, bookingData);

      if (customer) {
        const updatedData = {
          totalBookings: Number(customer.totalBookings || 0) + 1,
          totalHours: Number(customer.totalHours || 0) + duration,
          totalSpent: Number(customer.totalSpent || 0) + totalPrice,
          lastBooking: format(new Date(), 'yyyy-MM-dd'),
          status: 'Active',
          ...metadataPatch,
        };

        if (!customer.phone && bookingPhone) {
          updatedData.phone = bookingPhone;
        }

        if (!customer.email && clientEmail) {
          updatedData.email = clientEmail;
        }

        set((currentState) => ({
          customers: currentState.customers.map((candidate) => (
            candidate.id === customer.id ? { ...candidate, ...updatedData } : candidate
          )),
        }));

        if (useDemoStore.getState().isDemoMode) return { ...customer, ...updatedData };

        await updateDoc(doc(customersRef, customer.id.toString()), updatedData);
        await useAuditLogStore.getState().addLog({
          action: 'customer_booking_increment',
          entityType: 'customer',
          entityId: customer.id,
          summary: 'Stat pelanggan ' + (customer.name || cleanName || customer.id) + ' diperbarui dari approve request',
          metadata: updatedData,
        });

        return { ...customer, ...updatedData };
      }

      const id = Date.now();
      const newCustomer = {
        id,
        name: cleanName || 'Pelanggan Baru',
        phone: bookingPhoneDigits ? bookingPhone : '',
        email: clientEmail,
        instagram: '',
        address: '',
        projectName: bookingData.projectName || '',
        clientType: bookingData.clientType || '',
        primaryGenre: bookingData.primaryGenre || '',
        mainNeed: bookingData.mainNeed || '',
        memberCount: bookingData.memberCount || '',
        preferredDuration: bookingData.preferredDuration || '',
        preferredTime: bookingData.preferredTime || '',
        preferredDays: bookingData.preferredDays || '',
        socialLink: bookingData.socialLink || '',
        gearNotes: bookingData.gearNotes || '',
        invoiceName: bookingData.invoiceName || '',
        paymentPreference: bookingData.paymentPreference || '',
        clientLevel: bookingData.clientLevel || 'New',
        status: 'Active',
        notes: bookingData.sourceRequestId ? 'Auto-created dari request booking #' + bookingData.sourceRequestId : 'Auto-created dari booking client.',
        joinDate: format(new Date(), 'yyyy-MM-dd'),
        totalBookings: 1,
        totalHours: duration,
        totalSpent: totalPrice,
        lastBooking: format(new Date(), 'yyyy-MM-dd'),
        ...metadataPatch,
      };

      set((currentState) => ({ customers: [...currentState.customers, newCustomer] }));

      if (useDemoStore.getState().isDemoMode) return newCustomer;

      await setDoc(doc(customersRef, id.toString()), newCustomer);
      await useAuditLogStore.getState().addLog({
        action: 'customer_auto_create',
        entityType: 'customer',
        entityId: id,
        summary: 'Pelanggan ' + newCustomer.name + ' otomatis dibuat dari approve request',
        metadata: newCustomer,
      });

      return newCustomer;
    },

    getStats: () => {
      const state = get();
      const total = state.customers.length;
      const active = state.customers.filter((customer) => customer.status === 'Active').length;
      const inactive = state.customers.filter((customer) => customer.status === 'Inactive').length;
      const totalBookingsAll = state.customers.reduce((sum, customer) => sum + Number(customer.totalBookings || 0), 0);
      const totalHoursAll = state.customers.reduce((sum, customer) => sum + Number(customer.totalHours || 0), 0);
      const totalRevenueAll = state.customers.reduce((sum, customer) => sum + Number(customer.totalSpent || 0), 0);

      return {
        total,
        active,
        inactive,
        totalBookingsAll,
        totalHoursAll,
        totalRevenueAll,
      };
    },
  };
});
