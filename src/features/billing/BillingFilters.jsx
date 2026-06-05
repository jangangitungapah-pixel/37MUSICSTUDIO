import { ChevronDown, FileText, Search, X } from 'lucide-react';

const BillingFilters = ({
  activeTab,
  isFilterDropdownOpen,
  searchQuery,
  counts,
  filteredCount,
  onToggleFilterDropdown,
  onCloseFilterDropdown,
  onChangeTab,
  onSearchChange,
  onClearSearch,
}) => {
  const filterLabel = activeTab === 'Semua'
    ? `Semua Status (${counts.all})`
    : activeTab === 'Lunas'
      ? `Lunas (${counts.paid})`
      : `Belum Lunas (${counts.unpaid})`;

  return (
    <div className="app-table-toolbar">
      <div className="app-table-toolbar-left">
        <div>
          <span className="app-table-toolbar-title">Daftar Tagihan</span>
          <span className="app-table-toolbar-subtitle">{filteredCount} transaksi ditemukan</span>
        </div>
      </div>
      <div className="app-table-toolbar-right">
        <div className="filter-dropdown-container tour-bill-tabs">
          <button
            type="button"
            className="filter-dropdown-toggle"
            onClick={onToggleFilterDropdown}
            aria-haspopup="listbox"
            aria-expanded={isFilterDropdownOpen}
            aria-label="Filter status pembayaran"
          >
            <FileText size={16} className="filter-dropdown-icon" />
            <span className="filter-dropdown-label">{filterLabel}</span>
            <ChevronDown size={16} className={`filter-dropdown-arrow ${isFilterDropdownOpen ? 'open' : ''}`} />
          </button>

          {isFilterDropdownOpen && (
            <>
              <div className="filter-dropdown-overlay" onClick={onCloseFilterDropdown} />
              <div className="filter-dropdown-menu" role="listbox">
                <button
                  type="button"
                  className={`filter-dropdown-item ${activeTab === 'Semua' ? 'active' : ''}`}
                  onClick={() => onChangeTab('Semua')}
                  role="option"
                  aria-selected={activeTab === 'Semua'}
                >
                  <span>Semua Status</span>
                  <span className="tab-count">{counts.all}</span>
                </button>
                <button
                  type="button"
                  className={`filter-dropdown-item ${activeTab === 'Lunas' ? 'active' : ''}`}
                  onClick={() => onChangeTab('Lunas')}
                  role="option"
                  aria-selected={activeTab === 'Lunas'}
                >
                  <span>Lunas</span>
                  <span className="tab-count">{counts.paid}</span>
                </button>
                <button
                  type="button"
                  className={`filter-dropdown-item ${activeTab === 'Belum Lunas' ? 'active' : ''}`}
                  onClick={() => onChangeTab('Belum Lunas')}
                  role="option"
                  aria-selected={activeTab === 'Belum Lunas'}
                >
                  <span>Belum Lunas</span>
                  <span className="tab-count">{counts.unpaid}</span>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="app-search app-search-md tour-bill-search">
          <Search className="app-search-icon" />
          <input
            type="text"
            className="app-search-input"
            placeholder="Cari nama band..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Cari nama band atau tagihan"
          />
          {searchQuery && (
            <button type="button" className="app-search-clear" onClick={onClearSearch} aria-label="Bersihkan pencarian" title="Bersihkan pencarian">
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingFilters;
