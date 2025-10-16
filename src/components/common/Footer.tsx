import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Globe,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const Footer: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClientPortalClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  LiNES AND LiAiSON
                </h2>
                <p className="text-sm text-gray-400 font-medium">
                  Engineering Excellence
                </p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Premier engineering consultancy specializing in BIM and Integrated
              Concurrent Engineering, empowering clients with innovative
              solutions since 2016.
            </p>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/services"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Building Information Modeling
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Integrated Concurrent Engineering
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Structural Engineering
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  MEP Design
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Professional Training
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/about"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Our Services
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <button
                  onClick={handleClientPortalClick}
                  className="text-gray-300 hover:text-blue-400 transition-colors text-left"
                >
                  Client Portal
                </button>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">
                  Ras Al Khaimah
                  <br />
                  United Arab Emirates
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">
                  Dubai
                  <br />
                  United Arab Emirates
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <a
                  href="mailto:info@lines-liaison.xyz"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  info@lines-liaison.xyz
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <a
                  href="tel:+971501234567"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  +971 58 509 1209
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <a
                  href="https://lines-liaison.xyz"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  lines-liaison.xyz
                </a>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4 pt-4">
              <a
                href="#"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 LiNES AND LiAiSON. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 mt-4 sm:mt-0">
            <Link
              to="/privacy"
              className="text-gray-400 hover:text-blue-400 text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-gray-400 hover:text-blue-400 text-sm transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
