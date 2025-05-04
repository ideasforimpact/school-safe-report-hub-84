
import { Link } from 'react-router-dom';

const HeaderNavLinks = () => {
  return (
    <nav className="hidden md:block">
      <ul className="flex space-x-6 items-center">
        <li>
          <Link to="/" className="nav-link active">
            Home
          </Link>
        </li>
        <li>
          <Link to="/blog" className="nav-link">
            Blog
          </Link>
        </li>
        <li>
          <Link to="/pricing" className="nav-link">
            Pricing
          </Link>
        </li>
        <li>
          <Link to="/support" className="nav-link">
            Support
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default HeaderNavLinks;
