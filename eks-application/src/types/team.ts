type Author = {
  name: string;
  image: string;
  designation: string;
  company?: string;
  companyLogo?: string;
  summary?: string;
};

export type Blog = {
  id: number;
  title: string;
  image: string;
  author: Author;
  tags: string[] | null;
  publishDate: string;
  testimonial?: string;
  rating?: number;
};
