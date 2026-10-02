import { Feature } from "@/types/feature";
import { IconType } from "react-icons";

const SingleFeature = ({ feature }: { feature: Feature }) => {
  const { icon, title, paragraph } = feature;
  
  const renderIcon = () => {
    if (typeof icon === 'function') {
      const IconComponent = icon as IconType;
      return <IconComponent size={40} />;
    }
    return icon;
  };

  return (
    <div className="w-full group">
      <div className="relative overflow-hidden rounded-[28px] bg-[#0A688C] text-white p-8 shadow-xl border-2 border-[#0A688C]/40 transition-all duration-300 hover:-translate-y-1">
        <div className="relative z-10">
          <div className="mb-6 flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-white/10 text-white shadow">
            {renderIcon()}
          </div>
          <h3 className="mb-4 text-xl font-bold text-white sm:text-2xl lg:text-xl xl:text-2xl">
            {title}
          </h3>
          <p className="text-white/80 pr-[10px] text-base leading-relaxed font-medium">
            {paragraph}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SingleFeature;
