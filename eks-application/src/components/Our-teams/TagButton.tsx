const TagButton = ({ href = "#0", text }: { href?: string; text: string }) => {
  return (
    <a
      href={href}
      className="bg-gray-light mb-3 mr-3 inline-flex items-center justify-center rounded-xs px-4 py-2 text-sm text-primary duration-300 hover:bg-primary hover:text-white dark:bg-gray-800 dark:text-white dark:hover:bg-primary"
    >
      {text}
    </a>
  );
};

export default TagButton;
