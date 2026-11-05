import { motion } from "framer-motion";

import ProductCard from "./ProductCard";

const ProductGrid = ({ products }) => {
  return (
    <div className="w-full">

      {/* EMPTY STATE */}
      {products.length === 0 ? (
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          className="
            flex
            flex-col
            items-center
            justify-center
            rounded-[32px]
            border
            border-dashed
            border-gray-200
            bg-white/70
            backdrop-blur-xl
            py-20
            px-6
            text-center
          "
        >

          {/* ICON */}
          <div className="
            w-20
            h-20
            rounded-full
            bg-gradient-to-r
            from-indigo-500/10
            via-purple-500/10
            to-pink-500/10
            flex
            items-center
            justify-center
            text-3xl
          ">
            🛍️
          </div>

          {/* TITLE */}
          <h3 className="
            mt-6
            text-2xl
            font-black
            tracking-tight
            text-[#2b1d14]
          ">
            No Products Found
          </h3>

          {/* DESCRIPTION */}
          <p className="
            mt-3
            max-w-md
            text-gray-500
            leading-7
          ">
            Try adjusting your filters or search query
            to discover more fashion pieces.
          </p>

        </motion.div>
      ) : (

        /* PRODUCT GRID */
        <motion.div
          layout

          className="
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-3
            2xl:grid-cols-4
            gap-5
            xl:gap-6
          "
        >

          {products.map((p, index) => (
            <motion.div
              key={p._id || index}

              layout

              initial={{
                opacity: 0,
                y: 40,
              }}

              animate={{
                opacity: 1,
                y: 0,
              }}

              transition={{
                delay: index * 0.03,
                duration: 0.45,
              }}
            >

              <ProductCard product={p} />

            </motion.div>
          ))}

        </motion.div>
      )}

    </div>
  );
};

export default ProductGrid;