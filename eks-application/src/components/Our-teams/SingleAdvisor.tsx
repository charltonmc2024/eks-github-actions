import { Blog } from "@/types/team";
import Image from "next/image";

const SingleAdvisor = ({ blog, index }: { blog: Blog; index: number }) => {
  const { image, author } = blog;
  return (
    <div className="flex flex-col items-center justify-center relative">
      <div className="h-32 w-32 rounded-full overflow-hidden bg-white shadow relative" style={{ minWidth: 128, minHeight: 128 }}>
        <Image src={image} alt={author.name} width={128} height={128} className="object-cover w-full h-full" />
        {/* Index badge */}
        <span className="absolute top-2 right-2 bg-primary text-white text-xs font-bold rounded-full px-3 py-1 shadow-md">
          {index + 1}
        </span>
      </div>
    </div>
  );
};

export default SingleAdvisor; 