import { IconType } from "react-icons";
import { FiMonitor, FiTrendingUp, FiUsers, FiShield, FiClock, FiTarget } from "react-icons/fi";

interface Feature {
  id: number;
  icon: IconType;
  title: string;
  paragraph: string;
}

const featuresData: Feature[] = [
  {
    id: 1,
    icon: FiMonitor,
    title: "Dashboard Integration",
    paragraph:
      "Comprehensive dashboard that seamlessly integrates with existing school systems, providing real-time insights and analytics for administrators and teachers.",
  },
  {
    id: 2,
    icon: FiTrendingUp,
    title: "Progress Monitoring",
    paragraph:
      "Advanced progress tracking features that monitor student performance over time, identifying learning gaps and providing actionable insights for improvement.",
  },
  {
    id: 3,
    icon: FiUsers,
    title: "Teacher-Created Content",
    paragraph:
      "Empower teachers to create and customize assessment content tailored to their curriculum and student needs, ensuring relevance and engagement.",
  },
];

export default featuresData;
