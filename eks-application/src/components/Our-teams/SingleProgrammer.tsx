import { Blog } from "@/types/team";
import Image from "next/image";

const SingleProgrammer = ({ blog }: { blog: Blog }) => {
  const { image, author } = blog;
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="h-32 w-32 rounded-full overflow-hidden bg-white shadow" style={{ minWidth: 128, minHeight: 128 }}>
        <Image src={image} alt={author.name} width={128} height={128} className="object-cover w-full h-full" />
      </div>
    </div>
  );
};

export default SingleProgrammer; 