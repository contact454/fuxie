import type { CefrLevel } from "../constants/cefr";

export interface ScenarioOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetLevels: CefrLevel[];
}

export const SCENARIO_OPTIONS: ScenarioOption[] = [
  {
    id: "free_talk",
    title: "Trò chuyện Tự do",
    description: "Tán gẫu bất kỳ chủ đề nào bạn thích với Fuxie.",
    icon: "🦊",
    targetLevels: ["A1", "A2", "B1", "B2", "C1", "C2"],
  },
  {
    id: "restaurant_order",
    title: "Tại Nhà Hàng Berlin",
    description: "Đóng vai thực khách gọi món tại một nhà hàng Đức.",
    icon: "🍽️",
    targetLevels: ["A1", "A2"],
  },
  {
    id: "job_interview",
    title: "Phỏng Vấn Xin Việc",
    description: "Luyện tập trả lời phỏng vấn cho vị trí IT.",
    icon: "💼",
    targetLevels: ["B1", "B2", "C1", "C2"],
  },
  {
    id: "airport_checkin",
    title: "Làm Thủ Tục Sân Bay",
    description: "Check-in chuyến bay đi Frankfurt.",
    icon: "✈️",
    targetLevels: ["A2", "B1"],
  },
  {
    id: "supermarket_shopping_a1",
    title: "Mua sắm tại siêu thị",
    description:
      "Bạn đang đi mua sắm tại một siêu thị ở Đức. Hãy tương tác với nhân viên bán hàng để mua những thứ bạn cần.",
    icon: "🛒",
    targetLevels: ["A1"],
  },
  {
    id: "basic_health_doctor_visit_a1",
    title: "Sức khỏe cơ bản: Thăm bác sĩ",
    description:
      "Học viên đóng vai bệnh nhân, đi khám bác sĩ và mô tả các triệu chứng sức khỏe cơ bản bằng tiếng Đức A1.",
    icon: "🩺",
    targetLevels: ["A1"],
  },
  {
    id: "weekend_planning_a2",
    title: "Lên kế hoạch cuối tuần",
    description:
      "Hai người bạn gặp nhau và lên kế hoạch cho các hoạt động cuối tuần cùng nhau.",
    icon: "🗓️",
    targetLevels: ["A2"],
  },
  {
    id: "housing_search_a2",
    title: "Tìm kiếm nhà ở",
    description:
      "Học viên sẽ đóng vai người đang tìm kiếm một căn hộ mới và nói chuyện với một nhân viên bất động sản để tìm được căn hộ phù hợp.",
    icon: "🏠",
    targetLevels: ["A2"],
  },
  {
    id: "office_introduction_a2",
    title: "Làm quen đồng nghiệp mới",
    description:
      "Bạn là nhân viên mới tại một công ty Đức và gặp một đồng nghiệp. Hãy giới thiệu bản thân, trò chuyện cơ bản về công việc và hỏi một vài thông tin về công ty.",
    icon: "🏢",
    targetLevels: ["A2"],
  },
  {
    id: "wg_noise_conflict",
    title: "Xung đột trong căn hộ chung: Tiếng ồn",
    description:
      "Bạn sống trong một căn hộ chung (WG) và bạn cùng phòng của bạn thường xuyên gây ồn ào vào buổi tối, làm ảnh hưởng đến việc học hoặc giấc ngủ của bạn. Bạn cần nói chuyện với người bạn cùng phòng và tìm một giải pháp.",
    icon: "🗣️",
    targetLevels: ["B1"],
  },
  {
    id: "digital_life_cafe_chat_b1",
    title: "Đời sống kỹ thuật số: Cuộc trò chuyện tại quán cà phê",
    description:
      "Bạn gặp một người bạn tại quán cà phê và trò chuyện về cách công nghệ ảnh hưởng đến cuộc sống hàng ngày của bạn, từ mạng xã hội đến mua sắm trực tuyến và bảo mật dữ liệu.",
    icon: "📱",
    targetLevels: ["B1"],
  },
  {
    id: "restaurant_advanced_b1",
    title: "Đặt món và giải quyết vấn đề tại nhà hàng",
    description:
      "Học viên sẽ đóng vai khách hàng tại một nhà hàng sang trọng, phải đặt món, hỏi về các lựa chọn đặc biệt, và xử lý một vấn đề nhỏ phát sinh với đơn hàng của mình.",
    icon: "🍽️",
    targetLevels: ["B1"],
  },
  {
    id: "salary_negotiation_b2",
    title: "Đàm phán Lương",
    description:
      "Bạn sẽ đóng vai một nhân viên đang đàm phán mức lương mới hoặc tăng lương với quản lý cấp cao của mình tại một công ty Đức.",
    icon: "💰",
    targetLevels: ["B2"],
  },
  {
    id: "presentation_debate_environmental_project_b2",
    title: "Thuyết trình và Phản biện: Dự án Môi trường",
    description:
      "Bạn sẽ đóng vai một thành viên nhóm trình bày dự án môi trường của mình trước một ban giám khảo và bảo vệ quan điểm.",
    icon: "♻️",
    targetLevels: ["B2"],
  },
  {
    id: "political_social_discussion_b2",
    title: "Thảo luận về Chính sách Xã hội và Môi trường",
    description:
      "Bạn tham gia một buổi thảo luận nhóm về các chính sách xã hội và môi trường hiện tại ở Đức.",
    icon: "🌍",
    targetLevels: ["B2"],
  },
  {
    id: "journalistic_interview_c1",
    title: "Phỏng vấn báo chí về thành tựu khoa học",
    description:
      "Bạn đóng vai một nhà khoa học vừa đạt được một thành tựu quan trọng và trả lời phỏng vấn báo chí.",
    icon: "🎙️",
    targetLevels: ["C1"],
  },
  {
    id: "tech_ethics_c1_roleplay",
    title: "Đạo đức trong kỷ nguyên công nghệ số",
    description:
      "Bạn tham gia một hội nghị chuyên đề về đạo đức và công nghệ, thảo luận về thách thức và giải pháp.",
    icon: "🤖",
    targetLevels: ["C1"],
  },
  {
    id: "pr_crisis_food_recall",
    title: "Quản lý Khủng hoảng PR: Thu hồi Sản phẩm Thực phẩm",
    description:
      "Bạn là thành viên cấp cao trong đội PR của một công ty thực phẩm và cần xây dựng chiến lược ứng phó khủng hoảng.",
    icon: "🚨",
    targetLevels: ["C1"],
  },
];
