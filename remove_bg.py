from PIL import Image
from rembg import remove

print("Loading high-res image...")
input_img = Image.open('public/37upscale.png')
print("Removing background with rembg...")
output_img = remove(input_img)
output_img.save('public/logo.png')
print("Done! Replaced logo.png")
