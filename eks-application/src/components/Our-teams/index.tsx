import SectionTitle from "../Common/SectionTitle";
import SingleBlog from "./SingleBlog";
import SingleProgrammer from "./SingleProgrammer";
import teamData from "./blogData";

const Blog = () => {
  return (
    <section
      id="blog"
      className="bg-gray-light dark:bg-bg-color-dark py-16 md:py-20 lg:py-28"
    >
      <div className="container">
        <SectionTitle
          title="Our Latest Blogs"
          paragraph="There are many variations of passages of Lorem Ipsum available but the majority have suffered alteration in some form."
          center
        />

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 md:gap-x-6 lg:gap-x-8 xl:grid-cols-3">
          {teamData.map((blog) => (
            <div key={blog.id} className="w-full">
              {blog.id === 6 || blog.id === 7 || blog.id === 8 || blog.id === 9 || blog.id === 10 || blog.id === 11 ? (
                <SingleProgrammer blog={blog} />
              ) : (
                <SingleBlog blog={blog} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Blog;
