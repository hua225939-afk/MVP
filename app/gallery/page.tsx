import { PublicationGallery } from "@/components/publication/PublicProjectPage";
import { brand } from "@/config/brand";

export const metadata = {
  title: brand.galleryName,
};

export default function GalleryPage() {
  return <PublicationGallery />;
}
