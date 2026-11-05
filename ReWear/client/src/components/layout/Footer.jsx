import { motion } from "framer-motion";
import Logo from "../ui/Logo";

import {
  ArrowUpRight,
} from "lucide-react";

const Footer = () => {
  return (

    <footer className="w-full border-t border-gray-200 bg-[#fafafa]">

      <div
        className="
          max-w-7xl
          mx-auto
          px-6
          lg:px-8
          py-14
        "
      >

        {/* TOP */}
        <div
          className="
            flex
            flex-col
            lg:flex-row
            lg:items-start
            lg:justify-between
            gap-12
          "
        >

          {/* BRAND */}
          <div className="max-w-md">

            <h2>
              <Logo
                size={40}
                textClassName="text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
              />


            </h2>

            <p
              className="
                mt-5
                text-gray-600
                leading-7
              "
            >
              A smarter way to buy, rent,
              and resell fashion.
              Built for modern wardrobes,
              sustainable choices,
              and Gen Z lifestyles.
            </p>

          </div>

          {/* CENTER */}
          <div>

            <p
              className="
                text-sm
                font-semibold
                uppercase
                tracking-wider
                text-gray-400
              "
            >
              Academic Project
            </p>

            <div className="mt-5 space-y-3">

              <p className="text-gray-700">
                Medicaps University, Indore
              </p>

              <p className="text-gray-600 text-sm">
                Abhay Shukla — EN23CS301038
              </p>

              <p className="text-gray-600 text-sm">
                AbdulQadir — EN23CS301035
              </p>

              <p className="text-gray-600 text-sm">
                Adam Rajasthanwala — EN23CS301054
              </p>

            </div>

          </div>

          {/* RIGHT */}
          <div>

            {/* <p
              className="
                text-sm
                font-semibold
                uppercase
                tracking-wider
                text-gray-400
              "
            >
              Developed By
            </p> */}

            {/* <h3
              className="
                mt-5
                text-2xl
                font-bold
                text-[#2b1d14]
              "
            >
              HaideryDynamics
            </h3>

            <p
              className="
                mt-3
                text-gray-600
                leading-7
                max-w-xs
              "
            >
              Empowering businesses with
              technology, branding,
              and digital experiences.
            </p> */}

            {/* LINK */}
            {/* <motion.a
              whileHover={{
                x: 4,
              }}

              href="https://www.haiderydynamics.com"

              target="_blank"

              rel="noopener noreferrer"

              className="
                mt-6
                inline-flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-indigo-600
                hover:text-pink-500
                transition
              "
            >

              Explore More

              <ArrowUpRight size={16} />

            </motion.a> */}

          </div>

        </div>

        {/* DIVIDER */}
        <div className="mt-12 border-t border-gray-200" />

        {/* BOTTOM */}
        <div
          className="
            pt-6
            flex
            flex-col
            sm:flex-row
            items-center
            justify-between
            gap-4
          "
        >

          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} ReWear.
            All rights reserved.
          </p>

          <div
            className="
              flex
              items-center
              gap-6
              text-sm
              text-gray-500
            "
          >

            <button className="hover:text-indigo-600 transition">
              Privacy
            </button>

            <button className="hover:text-indigo-600 transition">
              Terms
            </button>

            <button className="hover:text-indigo-600 transition">
              Support
            </button>

          </div>

        </div>

      </div>

    </footer>
  );
};

export default Footer;