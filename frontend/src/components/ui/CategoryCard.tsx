import Link from "next/link";

interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  productCount?: number;
}

interface CategoryCardProps {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  icon?: string;
  description?: string;
  productCount?: number;
  subcategories?: SubCategory[];
}

const CategoryCard = ({ name, slug, image, icon, description, productCount, subcategories }: CategoryCardProps) => {
  return (
    <Link href={`/categories/${slug}`}>
      <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-[var(--primary)] hover:-translate-y-1 transition-all duration-200 cursor-pointer group h-full">
        <div className="w-16 h-16 mb-3 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden group-hover:bg-blue-100 transition-colors">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl">{icon || name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <span className="text-sm text-gray-700 font-semibold text-center group-hover:text-[var(--primary)] transition">
          {name}
        </span>
        {productCount !== undefined && (
          <span className="text-[11px] text-gray-400 mt-0.5">
            {productCount} product{productCount !== 1 ? "s" : ""}
          </span>
        )}
        {subcategories && subcategories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 justify-center">
            {subcategories.slice(0, 3).map((sub) => (
              <span
                key={sub._id}
                className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded"
              >
                {sub.name}
              </span>
            ))}
            {subcategories.length > 3 && (
              <span className="text-[10px] text-gray-400">
                +{subcategories.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default CategoryCard;
