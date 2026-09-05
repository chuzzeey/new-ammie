export type ProductForm = {
  id: string
  name: string
  badge: string
  price: string
  images: string[]
  sizes: string
  rating: string
  reviewCount: string
  description: string
  category: string
}

export const emptyForm: ProductForm = {
  id: "",
  name: "",
  badge: "",
  price: "",
  // 5 total image slots: index 0 is the main image, indices 1-4 are the
  // 4 additional images. The thumbnail strip visually mirrors index 0 as
  // its first thumbnail (see ImageGallery), so there is no separate
  // stored slot for that mirror — 5 stored images produce 5 thumbnails.
  images: ["", "", "", "", ""],
  sizes: "",
  rating: "0",
  reviewCount: "",
  description: "",
  category: "ready_to_ship_braided_wigs"
}
