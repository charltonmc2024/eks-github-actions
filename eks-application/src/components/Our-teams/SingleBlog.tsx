import { Blog } from "@/types/team";
import Image from "next/image";
import Link from "next/link";

const SingleBlog = ({ blog }: { blog: Blog }) => {
  const { title, image, author, tags, publishDate } = blog;
  const href =
    blog.id === 1
      ? "/our-team-details/arnold-details"
      : blog.id === 2
      ? "/our-team-details/ysh-details"
      : blog.id === 3
      ? "/our-team-details/flo-details"
      : blog.id === 4
      ? "/our-team-details/billy-details"
      : "/our-team-details";
  return (
    <div className="group bg-[#0A688C] text-white border border-[#0A688C]/40 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full overflow-hidden">
      <Link
        href={href}
        className="block relative w-full aspect-[4/5] bg-gray-100 dark:bg-gray-900 overflow-hidden"
      >
        <Image
          src={image}
          alt="image"
          fill
          className="object-cover object-top w-full h-full transition-transform duration-300 group-hover:scale-105 rounded-b-none"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </Link>
      <div className="flex-1 flex flex-col px-6 py-6">
        <span className="inline-block bg-white/10 text-white px-5 py-2 rounded-full font-semibold text-base mb-5 shadow-sm text-center mx-auto">
          {title}
        </span>
        <div className="mt-auto flex items-center pt-4 border-t border-white/20">
          <div className="flex items-center mr-5 pr-5 border-r border-white/20">
            <div className="relative h-10 w-10 overflow-hidden rounded-full mr-3">
              <Image src={author.image} alt="author" fill />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-0.5">
                {author.name}
              </h4>
              <p className="text-white/70 text-xs font-medium">
                {author.designation}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-white/70 text-xs font-medium uppercase tracking-widest mb-0.5">
              Date
            </span>
            {/* <span className="text-primary dark:text-gray-300 text-xs font-semibold">
              {publishDate}
            </span> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleBlog;
