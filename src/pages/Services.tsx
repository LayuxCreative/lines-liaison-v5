import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Zap,
  Shield,
  Cog,
  Users,
  BarChart3,
  BookOpen,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Services: React.FC = () => {
  const { user } = useAuth();

  const services = [
    {
      icon: Building2,
      title: "Building Information Modeling (BIM)",
      description:
        "Advanced 3D modeling and digital twin creation for complex architectural and engineering projects.",
      features: [
        "3D Architectural Modeling",
        "Structural BIM Services",
        "MEP System Integration",
        "Clash Detection & Resolution",
        "4D Schedule Integration",
        "5D Cost Modeling",
      ],
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Zap,
      title: "Integrated Concurrent Engineering (iCE)",
      description:
        "Streamlined engineering processes with cross-disciplinary collaboration and optimization.",
      features: [
        "Multi-discipline Coordination",
        "Process Optimization",
        "Design Integration",
        "Risk Assessment",
        "Quality Management",
        "Performance Analytics",
      ],
      color: "from-teal-500 to-teal-600",
    },
    {
      icon: Shield,
      title: "Structural Engineering & Analysis",
      description:
        "Comprehensive structural design, analysis, and optimization for safe and efficient buildings.",
      features: [
        "Structural Design",
        "Load Analysis",
        "Seismic Assessment",
        "Foundation Design",
        "Steel & Concrete Design",
        "Structural Health Monitoring",
      ],
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: Cog,
      title: "Mechanical Engineering Design",
      description:
        "Advanced HVAC, plumbing, and mechanical systems design and optimization.",
      features: [
        "HVAC System Design",
        "Plumbing & Fire Protection",
        "Energy Modeling",
        "Equipment Selection",
        "System Commissioning",
        "Performance Optimization",
      ],
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: BarChart3,
      title: "Feasibility Studies & Risk Assessment",
      description:
        "Comprehensive project evaluation and risk analysis for informed decision-making.",
      features: [
        "Project Feasibility Analysis",
        "Risk Identification",
        "Cost-Benefit Analysis",
        "Market Assessment",
        "Technical Evaluation",
        "ROI Calculations",
      ],
      color: "from-green-500 to-green-600",
    },
    {
      icon: Building2,
      title: "Civil Engineering & Urban Planning",
      description:
        "Infrastructure design and urban development planning services.",
      features: [
        "Site Planning & Design",
        "Transportation Systems",
        "Utility Infrastructure",
        "Environmental Impact",
        "Master Planning",
        "Regulatory Compliance",
      ],
      color: "from-indigo-500 to-indigo-600",
    },
    {
      icon: Cog,
      title: "Industrial Engineering & Process Optimization",
      description:
        "Manufacturing and industrial process design and optimization services.",
      features: [
        "Process Design",
        "Workflow Optimization",
        "Lean Manufacturing",
        "Quality Systems",
        "Automation Integration",
        "Performance Metrics",
      ],
      color: "from-red-500 to-red-600",
    },
    {
      icon: BookOpen,
      title: "Professional Training & Workshops",
      description:
        "Industry-leading certification programs and professional development courses.",
      features: [
        "BIM Training Programs",
        "Software Certification",
        "Professional Workshops",
        "Custom Corporate Training",
        "Online Learning Platform",
        "Continuing Education",
      ],
      color: "from-yellow-500 to-yellow-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Our Services
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Comprehensive engineering solutions designed to meet the complex
              demands of modern construction, infrastructure, and industrial
              projects.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start space-x-6">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center flex-shrink-0`}
                  >
                    <service.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {service.description}
                    </p>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">
                        Key Features:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {service.features.map((feature, featureIndex) => (
                          <div
                            key={featureIndex}
                            className="flex items-center space-x-2"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Our Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A systematic approach to delivering exceptional engineering
              solutions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Discovery",
                description:
                  "Understanding your project requirements and objectives",
              },
              {
                step: "02",
                title: "Planning",
                description:
                  "Comprehensive project planning and resource allocation",
              },
              {
                step: "03",
                title: "Execution",
                description:
                  "Implementation with continuous monitoring and quality control",
              },
              {
                step: "04",
                title: "Delivery",
                description: "Final delivery with documentation and support",
              },
            ].map((phase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {phase.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {phase.title}
                </h3>
                <p className="text-gray-600">{phase.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-teal-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Contact us today to discuss your project requirements and learn
              how our engineering expertise can bring your vision to life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300 transform hover:scale-105"
              >
                Get Free Consultation
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to={user ? "/dashboard" : "/login"}
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300"
              >
                Access Portal
                <Users className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Services;
