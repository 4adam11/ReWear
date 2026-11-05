import { Link } from "react-router-dom";
import { LogoMark } from "../ui/Logo";

const Column = ({ title, children }) => (
  <div className="flex flex-col gap-2.5">
    <p className="text-sm font-semibold text-paper">{title}</p>
    {children}
  </div>
);

const FooterLink = ({ to, children }) => (
  <Link to={to} className="text-sm text-[#e3d5c4] hover:text-white">
    {children}
  </Link>
);

const Footer = () => (
  <footer className="mt-16 bg-ink text-[#e3d5c4]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
      <div className="flex flex-col gap-3">
        <span className="inline-flex items-center gap-2.5">
          <LogoMark size={32} />
          <span className="text-xl font-bold text-paper">ReWear</span>
        </span>
        <p className="text-sm leading-6 max-w-xs">
          A marketplace for buying and renting pre-loved Indian fashion. Every listing is checked by our team before it goes live.
        </p>
      </div>

      <Column title="Shop">
        <FooterLink to="/explore?mode=rent">Rent an outfit</FooterLink>
        <FooterLink to="/explore?mode=sale">Buy pre-loved</FooterLink>
        <FooterLink to="/explore?category=wedding">Wedding wear</FooterLink>
        <FooterLink to="/howitworks">How it works</FooterLink>
      </Column>

      <Column title="Sell">
        <FooterLink to="/sell">List an item</FooterLink>
        <FooterLink to="/seller/listings">My listings</FooterLink>
        <FooterLink to="/seller/orders">Orders to fulfil</FooterLink>
      </Column>

      <Column title="Academic project">
        <span className="text-sm">Medicaps University, Indore</span>
        <span className="text-sm">Abhay Shukla — EN23CS301038</span>
        <span className="text-sm">AbdulQadir — EN23CS301035</span>
        <span className="text-sm">Adam Rajasthanwala — EN23CS301054</span>
      </Column>
    </div>

    <div className="border-t border-white/10">
      <p className="max-w-7xl mx-auto px-4 sm:px-6 py-5 text-xs text-[#bfae9c]">
        © {new Date().getFullYear()} ReWear
      </p>
    </div>
  </footer>
);

export default Footer;
