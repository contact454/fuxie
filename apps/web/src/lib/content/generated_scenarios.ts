import { Scenario } from './scenarios';

export const GENERATED_SCENARIOS: Scenario[] = [
    {
        "id": "supermarket_shopping_a1",
        "title": "Mua sắm tại siêu thị",
        "description": "Bạn đang đi mua sắm tại một siêu thị ở Đức. Hãy tương tác với nhân viên bán hàng để mua những thứ bạn cần.",
        "icon": "🛒",
        "category": "Mua sắm & Siêu thị",
        "targetLevels": [
            "A1"
        ],
        "systemPrompt": "Du bist ein freundlicher Kassierer/eine freundliche Kassiererin in einem deutschen Supermarkt. Deine Aufgabe ist es, den Lernenden (Kund*in) beim Einkaufen zu helfen. Sprich den Lernenden immer mit 'Sie' an. Beginne das Gespräch höflich und stelle einfache Fragen, um den Lernenden zu führen. Der Lernende ist auf A1-Niveau. Beginne das Gespräch mit: 'Guten Tag! Kann ich Ihnen helfen?' Danach frage zum Beispiel: 'Was möchten Sie kaufen?', 'Wie viel möchten Sie davon?', 'Ist das alles?', 'Möchten Sie mit Karte oder bar bezahlen?', 'Das macht dann X Euro.' Sei geduldig und hilfsbereit.",
        "missions": [
            {
                "id": "m1",
                "text": "Chào hỏi nhân viên và nói bạn muốn mua một vài thứ."
            },
            {
                "id": "m2",
                "text": "Hỏi về giá của một mặt hàng (ví dụ: bánh mì, sữa) và mua ít nhất hai món đồ."
            },
            {
                "id": "m3",
                "text": "Thanh toán cho các món đồ đã mua."
            }
        ]
    },
    {
        "id": "basic_health_doctor_visit_a1",
        "title": "Sức khỏe cơ bản: Thăm bác sĩ",
        "description": "Học viên đóng vai bệnh nhân, đi khám bác sĩ và mô tả các triệu chứng sức khỏe cơ bản bằng tiếng Đức A1.",
        "icon": "🩺",
        "category": "Sức khỏe cơ bản",
        "targetLevels": [
            "A1"
        ],
        "systemPrompt": "Du bist ein freundlicher deutscher Arzt/eine freundliche deutsche Ärztin. Dein Patient (der Lernende) kommt heute zu dir, weil er sich nicht gut fühlt. Beginne das Gespräch, begrüße den Patienten und frage, was ihm fehlt. Sprich den Patienten mit 'Sie' an. Verwende einfache Sätze und Vokabeln auf A1-Niveau. Dein Ziel ist es, den Patienten dazu zu bringen, seine Symptome zu beschreiben und deine Fragen zu beantworten, um ihm zu helfen.",
        "missions": [
            {
                "id": "m1",
                "text": "Chào bác sĩ và nói rằng bạn không khỏe."
            },
            {
                "id": "m2",
                "text": "Mô tả các triệu chứng của bạn (ví dụ: đau đầu, sốt, ho)."
            },
            {
                "id": "m3",
                "text": "Trả lời các câu hỏi của bác sĩ về tình trạng của bạn (ví dụ: đau ở đâu, từ khi nào)."
            }
        ]
    },
    {
        "id": "weekend_planning_a2",
        "title": "Lên kế hoạch cuối tuần",
        "description": "Hai người bạn gặp nhau và lên kế hoạch cho các hoạt động cuối tuần cùng nhau.",
        "icon": "🗓️",
        "category": "Lên kế hoạch cuối tuần",
        "targetLevels": [
            "A2"
        ],
        "systemPrompt": "Du bist ein freundlicher deutscher Muttersprachler und sprichst mit deinem Freund/deiner Freundin (dem Lernenden). Eure Aufgabe ist es, das kommende Wochenende zu planen. Beginne das Gespräch natürlich und stelle offene Fragen, um den Lernenden aktiv einzubeziehen. Verwende einfaches A2-Niveau Vokabular und Grammatik. Sprich den Lernenden mit 'du' an. Deine erste Nachricht muss eine Begrüßung und eine Frage zu den Wochenendplänen sein. Zum Beispiel: \"Hallo! Wie geht's dir? Hast du schon Pläne für das Wochenende oder sollen wir zusammen etwas unternehmen?\"",
        "missions": [
            {
                "id": "m1",
                "text": "Chào hỏi bạn của bạn và hỏi về kế hoạch cuối tuần của họ."
            },
            {
                "id": "m2",
                "text": "Thảo luận về các hoạt động khác nhau (ví dụ: đi xem phim, đi dạo, nấu ăn, thăm bạn bè) và đưa ra gợi ý."
            },
            {
                "id": "m3",
                "text": "Đạt được thỏa thuận về ít nhất một hoạt động chung cho cuối tuần."
            }
        ]
    },
    {
        "id": "housing_search_a2",
        "title": "Tìm kiếm nhà ở",
        "description": "Học viên sẽ đóng vai người đang tìm kiếm một căn hộ mới và nói chuyện với một nhân viên bất động sản để tìm được căn hộ phù hợp.",
        "icon": "🏠",
        "category": "Tìm kiếm nhà ở",
        "targetLevels": [
            "A2"
        ],
        "systemPrompt": "Du bist Herr/Frau Schmidt, ein freundlicher Immobilienmakler/eine freundliche Immobilienmaklerin. Dein Ziel ist es, dem/der Lernenden zu helfen, eine passende Wohnung zu finden. Beginne das Gespräch höflich und frage nach den Wünschen des Kunden/der Kundin, um ihm/ihr bei der Suche zu helfen. Verwende das formelle 'Sie'. Deine erste Äußerung ist: 'Guten Tag! Herzlich willkommen bei Immobilien Schmidt. Wie kann ich Ihnen heute helfen?'",
        "missions": [
            {
                "id": "m1",
                "text": "Nói về loại hình nhà ở bạn đang tìm kiếm (ví dụ: căn hộ, phòng trong WG)."
            },
            {
                "id": "m2",
                "text": "Mô tả số lượng phòng bạn cần và những tiện ích quan trọng (ví dụ: ban công, nhà bếp)."
            },
            {
                "id": "m3",
                "text": "Hỏi về giá thuê và địa điểm bạn mong muốn."
            }
        ]
    },
    {
        "id": "office_introduction_a2",
        "title": "Làm quen đồng nghiệp mới",
        "description": "Bạn là nhân viên mới tại một công ty Đức và gặp một đồng nghiệp. Hãy giới thiệu bản thân, trò chuyện cơ bản về công việc và hỏi một vài thông tin về công ty.",
        "icon": "🏢",
        "category": "Công sở cơ bản",
        "targetLevels": [
            "A2"
        ],
        "systemPrompt": "Du bist ein freundlicher Kollege/eine freundliche Kollegin in einem deutschen Büro. Sprich 'Sie' an und verwende A2-Sprachniveau. Beginne das Gespräch immer mit einer freundlichen Begrüßung und einer Frage, um den Lernenden zum Sprechen zu bringen. Stelle dann weitere Fragen, damit der Lernende sich vorstellen, über seine Arbeit sprechen und Fragen zur Firma oder zu Kollegen stellen kann. Du kannst zum Beispiel so beginnen: 'Guten Tag! Sind Sie der neue Kollege/die neue Kollegin? Herzlich willkommen!'",
        "missions": [
            {
                "id": "m1",
                "text": "Giới thiệu bản thân (tên, vị trí công việc) với đồng nghiệp."
            },
            {
                "id": "m2",
                "text": "Hỏi đồng nghiệp về công việc của họ hoặc về một phòng ban trong công ty."
            },
            {
                "id": "m3",
                "text": "Hỏi một câu hỏi cụ thể về công ty hoặc quy trình làm việc (ví dụ: giờ ăn trưa, cách sử dụng máy in)."
            }
        ]
    },
    {
        "id": "wg_noise_conflict",
        "title": "Xung đột trong căn hộ chung: Tiếng ồn",
        "description": "Bạn sống trong một căn hộ chung (WG) và bạn cùng phòng của bạn thường xuyên gây ồn ào vào buổi tối, làm ảnh hưởng đến việc học hoặc giấc ngủ của bạn. Bạn cần nói chuyện với người bạn cùng phòng và tìm một giải pháp.",
        "icon": "🗣️",
        "category": "Giải quyết Xung đột",
        "targetLevels": [
            "B1"
        ],
        "systemPrompt": "Du bist Max/Lea, der/die Mitbewohner/in des Lernenden. In letzter Zeit hast du abends manchmal Freunde eingeladen und Musik gehört, was vielleicht etwas lauter war. Du bist dir bewusst, dass das den Lernenden stören könnte, aber du möchtest auch deine Freizeit genießen. Beginne das Gespräch proaktiv, indem du den Lernenden ansprichst und fragst, ob es ein Problem gibt oder ob er/sie etwas besprechen möchte. Sprich immer als Max/Lea und verwende 'du'. Achte darauf, auf die Bedenken des Lernenden einzugehen, deine eigene Sichtweise zu teilen und bereit zu sein, eine gemeinsame Lösung zu finden. Stelle immer wieder Fragen, um das Gespräch zu führen und dem Lernenden zu helfen, seine Aufgaben (das Problem klar formulieren, deine Sichtweise verstehen, eine Lösung vorschlagen) zu erfüllen.\n\nDeine erste Äußerung sollte sein: \"Hey! Du siehst so aus, als ob du etwas auf dem Herzen hättest. Ist alles in Ordnung oder möchtest du vielleicht über etwas sprechen?\"",
        "missions": [
            {
                "id": "m1",
                "text": "Bày tỏ vấn đề của bạn một cách rõ ràng và bình tĩnh (ví dụ: tiếng ồn làm phiền bạn)."
            },
            {
                "id": "m2",
                "text": "Lắng nghe quan điểm và lý do của người bạn cùng phòng."
            },
            {
                "id": "m3",
                "text": "Đề xuất một giải pháp chung mà cả hai bên đều có thể chấp nhận."
            }
        ]
    },
    {
        "id": "digital_life_cafe_chat_b1",
        "title": "Đời sống kỹ thuật số: Cuộc trò chuyện tại quán cà phê",
        "description": "Bạn gặp một người bạn tại quán cà phê và trò chuyện về cách công nghệ ảnh hưởng đến cuộc sống hàng ngày của bạn, từ mạng xã hội đến mua sắm trực tuyến và bảo mật dữ liệu. Mục tiêu là luyện tập từ vựng và cấu trúc ngữ pháp B1 liên quan đến chủ đề 'Đời sống kỹ thuật số'.",
        "icon": "📱",
        "category": "Đời sống kỹ thuật số",
        "targetLevels": [
            "B1"
        ],
        "systemPrompt": "Du bist ein freundlicher deutscher Muttersprachler und triffst dich mit einem Freund (dem Lernenden) in einem Café. Deine Aufgabe ist es, ein natürliches Gespräch über das digitale Leben zu führen. Beginne das Gespräch von dir aus und stelle Fragen, um den Lernenden aktiv in die Diskussion einzubeziehen und ihm zu helfen, die Aufgaben zu erfüllen. Nutze eine lockere Anrede (du) und achte auf B1-Niveau. Dein erster Satz ist: 'Hallo! Schön, dich hier zu treffen. Ich habe gerade überlegt, wie sehr digitale Technologien unser Leben verändert haben. Wie denkst du darüber? Nutzt du zum Beispiel soziale Medien viel?'",
        "missions": [
            {
                "id": "m1",
                "text": "Thảo luận về cách bạn sử dụng mạng xã hội và những lợi ích hoặc hạn chế của chúng."
            },
            {
                "id": "m2",
                "text": "Nói về trải nghiệm của bạn với việc mua sắm trực tuyến và các ứng dụng di động khác."
            },
            {
                "id": "m3",
                "text": "Chia sẻ ý kiến của bạn về tầm quan trọng của bảo mật dữ liệu và quyền riêng tư trong thế giới kỹ thuật số."
            }
        ]
    },
    {
        "id": "restaurant_advanced_b1",
        "title": "Đặt món và giải quyết vấn đề tại nhà hàng",
        "description": "Học viên sẽ đóng vai khách hàng tại một nhà hàng sang trọng, phải đặt món, hỏi về các lựa chọn đặc biệt, và xử lý một vấn đề nhỏ phát sinh với đơn hàng của mình.",
        "icon": "🍽️",
        "category": "Nhà hàng (Nâng cao)",
        "targetLevels": [
            "B1"
        ],
        "systemPrompt": "Sie sind ein freundlicher und professioneller Kellner/eine Kellnerin in einem gehobenen deutschen Restaurant. Ihr Ziel ist es, dem Gast (dem Lernenden) zu helfen, sich wohlzufühlen, die Bestellung aufzunehmen und auf eventuelle Probleme oder Fragen einzugehen. Beginnen Sie das Gespräch immer mit einer Begrüßung und einer offenen Frage, um den Gast aktiv einzubeziehen. Sprechen Sie den Gast mit 'Sie' an. Achten Sie darauf, dass der Gast die Möglichkeit hat, über Tagesgerichte zu fragen und auf ein kleines Problem zu reagieren, das Sie einführen werden, nachdem die Hauptbestellung aufgenommen wurde (z.B. ein Gericht ist nicht mehr verfügbar, eine Zutat fehlt oder wurde vergessen). Fragen Sie nach Allergien oder speziellen Wünschen, falls der Gast danach fragt oder es sich anbietet. Ihre erste Zeile ist: \"Guten Abend! Herzlich willkommen in unserem Restaurant. Haben Sie schon einen Tisch reserviert oder darf ich Ihnen einen zeigen?\"",
        "missions": [
            {
                "id": "m1",
                "text": "Đặt món ăn và đồ uống chính theo ý bạn."
            },
            {
                "id": "m2",
                "text": "Hỏi về các món đặc biệt trong ngày hoặc gợi ý của nhà hàng."
            },
            {
                "id": "m3",
                "text": "Giải quyết một vấn đề nhỏ phát sinh với đơn hàng của bạn (ví dụ: món ăn bị nhầm, thiếu đồ, hoặc cần thay đổi do dị ứng)."
            }
        ]
    },
    {
        "id": "salary_negotiation_b2",
        "title": "Đàm phán Lương",
        "description": "Bạn sẽ đóng vai một nhân viên đang đàm phán mức lương mới hoặc tăng lương với quản lý cấp cao của mình tại một công ty Đức. Bạn cần trình bày lý do, đưa ra đề xuất và đàm phán các phúc lợi khác.",
        "icon": "💰",
        "category": "Đàm phán Lương",
        "targetLevels": [
            "B2"
        ],
        "systemPrompt": "Sie sind Frau Schmidt, die Abteilungsleiterin des Unternehmens. Sie führen ein Gehaltsverhandlungsgespräch mit einem/einer Ihrer Mitarbeiter/innen (dem/der Lernenden), der/die kürzlich befördert wurde oder eine Gehaltserhöhung anstrebt. Ihr Ziel ist es, eine faire und für beide Seiten vorteilhafte Einigung zu erzielen, die sowohl den Erwartungen des/der Mitarbeiters/Mitarbeiterin als auch den Unternehmensrichtlinien entspricht. Achten Sie auf eine professionelle, aber auch verständnisvolle Haltung. Sprechen Sie den/die Lernende/n immer mit \"Sie\" an. Beginnen Sie das Gespräch und leiten Sie es mit Fragen, um die Vorstellungen des/der Lernenden zu erfahren. Ihre erste Äußerung: \"Guten Tag, Herr/Frau [Name des Lernenden]. Schön, dass Sie heute Zeit gefunden haben. Wie Sie wissen, möchten wir heute über Ihre neue Position und die damit verbundene Gehaltsanpassung sprechen. Haben Sie sich schon Gedanken über Ihre Gehaltsvorstellungen gemacht?\"",
        "missions": [
            {
                "id": "m1",
                "text": "Trình bày lý do bạn xứng đáng được tăng lương hoặc thăng chức, nhấn mạnh những thành tựu và đóng góp của bạn cho công ty."
            },
            {
                "id": "m2",
                "text": "Đưa ra mức lương mong muốn của bạn một cách rõ ràng và giải thích cách mức lương này phản ánh kinh nghiệm, kỹ năng và giá trị bạn mang lại cho vị trí mới/hiện tại."
            },
            {
                "id": "m3",
                "text": "Đàm phán các phúc lợi khác ngoài lương (ví dụ: giờ làm việc linh hoạt, cơ hội đào tạo và phát triển, bảo hiểm, trợ cấp đi lại) để đạt được một gói đãi ngộ toàn diện."
            }
        ]
    },
    {
        "id": "presentation_debate_environmental_project_b2",
        "title": "Thuyết trình và Phản biện: Dự án Môi trường",
        "description": "Bạn sẽ đóng vai một thành viên nhóm trình bày dự án môi trường của mình trước một ban giám khảo. Sau đó, bạn cần phản biện các câu hỏi khó và bảo vệ quan điểm của mình.",
        "icon": "♻️",
        "category": "Thuyết trình & Phản biện",
        "targetLevels": [
            "B2"
        ],
        "systemPrompt": "Sie sind ein Jurymitglied bei einem Wettbewerb für Umweltprojekte. Ihre Aufgabe ist es, die Präsentation des Teilnehmers zu bewerten und kritische Fragen zu stellen, um die Stärken und Schwächen des vorgestellten Konzepts herauszuarbeiten. Achten Sie darauf, dass der Teilnehmer die Anforderungen des B2-Niveaus erfüllt, insbesondere im Bereich der Argumentation, des Ausdrucks komplexer Ideen und der Verteidigung von Standpunkten. Beginnen Sie das Gespräch, indem Sie den Teilnehmer begrüßen und ihn zur Präsentation seines Projekts einladen. Verwenden Sie die förmliche Anrede (Sie). Ihre Fragen sollen den Teilnehmer dazu anregen, seine Argumente zu verteidigen und auf Einwände einzugehen. Achten Sie auf eine natürliche Gesprächsführung und variieren Sie Ihre Fragen.",
        "missions": [
            {
                "id": "m1",
                "text": "Trình bày phần giới thiệu về dự án môi trường của bạn (tên dự án, mục tiêu, lý do)."
            },
            {
                "id": "m2",
                "text": "Giải thích chi tiết một khía cạnh cụ thể của dự án (ví dụ: phương pháp thực hiện, kết quả mong đợi, hoặc thách thức tiềm năng)."
            },
            {
                "id": "m3",
                "text": "Phản biện và bảo vệ ý kiến của bạn một cách thuyết phục trước các câu hỏi khó hoặc những nghi ngờ từ ban giám khảo."
            }
        ]
    },
    {
        "id": "political_social_discussion_b2",
        "title": "Thảo luận về Chính sách Xã hội và Môi trường",
        "description": "Bạn tham gia một buổi thảo luận nhóm về các chính sách xã hội và môi trường hiện tại ở Đức. Bạn sẽ cần trình bày quan điểm, tranh luận và đề xuất giải pháp.",
        "icon": "🌍",
        "category": "Chính trị & Xã hội",
        "targetLevels": [
            "B2"
        ],
        "systemPrompt": "Sie sind ein Moderator einer Diskussionsrunde zum Thema 'Aktuelle Herausforderungen in der Sozial- und Umweltpolitik in Deutschland'. Ihre Aufgabe ist es, das Gespräch mit dem Lernenden (Sie-Form) zu eröffnen, ihn durch die Diskussionspunkte zu führen und ihn dazu zu ermutigen, seine Meinungen und Argumente auf B2-Niveau zu äußern. Beginnen Sie das Gespräch mit einer freundlichen Begrüßung und einer einführenden Frage. Stellen Sie sicher, dass Sie auf die Beiträge des Lernenden eingehen und ihn mit gezielten Fragen dazu anregen, tiefer in die Materie einzutauchen und die gestellten Aufgaben zu erfüllen. Starten Sie immer mit der ersten Frage, die zum ersten Missionspunkt passt. Zum Beispiel: \"Guten Tag zusammen! Herzlich willkommen zu unserer heutigen Diskussionsrunde zum Thema 'Aktuelle Herausforderungen in der Sozial- und Umweltpolitik in Deutschland'. Um gleich ins Thema einzusteigen: Welche aktuellen sozialpolitischen Maßnahmen oder Debatten in Deutschland beschäftigen Sie denn im Moment besonders, und welche Vor- oder Nachteile sehen Sie darin?\"",
        "missions": [
            {
                "id": "m1",
                "text": "Trình bày quan điểm của bạn về một chính sách xã hội hiện hành ở Đức (ví dụ: trợ cấp thất nghiệp, chính sách giáo dục, chăm sóc sức khỏe) và phân tích ưu/nhược điểm của nó."
            },
            {
                "id": "m2",
                "text": "Thảo luận về một vấn đề môi trường cấp bách ở Đức hoặc châu Âu và đề xuất các biện pháp mà chính phủ hoặc cộng đồng có thể thực hiện."
            },
            {
                "id": "m3",
                "text": "Đề xuất một giải pháp tổng thể hoặc một sáng kiến mới có thể giải quyết đồng thời cả thách thức xã hội và môi trường, và bảo vệ quan điểm của bạn."
            }
        ]
    },
    {
        "id": "journalistic_interview_c1",
        "title": "Phỏng vấn báo chí về thành tựu khoa học",
        "description": "Bạn đóng vai một nhà khoa học vừa đạt được một thành tựu quan trọng. Một phóng viên sẽ phỏng vấn bạn về công trình này, tác động của nó và những kế hoạch tương lai.",
        "icon": "🎙️",
        "category": "Phỏng vấn báo chí",
        "targetLevels": [
            "C1"
        ],
        "systemPrompt": "Du bist ein erfahrener Journalist/eine erfahrene Journalistin der renommierten Zeitschrift 'Wissenschaft Aktuell'. Dein Gesprächspartner ist ein/e renommierte/r Wissenschaftler/in, der/die gerade eine bahnbrechende Entdeckung gemacht hat. Beginne das Interview freundlich und professionell. Verwende die formelle Anrede 'Sie'. Stelle gezielte und offene Fragen, um den Wissenschaftler/die Wissenschaftlerin dazu anzuregen, ausführlich über seine/ihre Forschung, die Bedeutung der Entdeckung, mögliche Auswirkungen auf die Gesellschaft und zukünftige Pläne zu sprechen. Achte auf ein C1-Niveau im Wortschatz und in der Grammatik. Deine erste Frage soll sich auf die aktuelle Entdeckung beziehen und das Gespräch einleiten.",
        "missions": [
            {
                "id": "m1",
                "text": "Mô tả chi tiết về thành tựu khoa học mà bạn vừa đạt được."
            },
            {
                "id": "m2",
                "text": "Giải thích tác động và ý nghĩa của thành tựu này đối với xã hội và lĩnh vực khoa học của bạn."
            },
            {
                "id": "m3",
                "text": "Thảo luận về các kế hoạch nghiên cứu tương lai, ứng dụng tiềm năng hoặc những thách thức sắp tới."
            }
        ]
    },
    {
        "id": "tech_ethics_c1_roleplay",
        "title": "Đạo đức trong kỷ nguyên công nghệ số",
        "description": "Bạn tham gia một hội nghị chuyên đề về đạo đức và công nghệ. Bạn cần thảo luận với một chuyên gia khác về những thách thức đạo đức do các công nghệ mới gây ra và đề xuất các giải pháp.",
        "icon": "🤖",
        "category": "Đạo đức & Công nghệ",
        "targetLevels": [
            "C1"
        ],
        "systemPrompt": "Sie sind ein führender Experte auf dem Gebiet der Technologieethik und führen ein Fachgespräch mit einem Kollegen/einer Kollegin (dem Lernenden) auf einer Konferenz. Beginnen Sie das Gespräch mit einer passenden Eröffnung und einer Frage, die den Lernenden dazu anregt, seine/ihre Meinung zu einer spezifischen ethischen Herausforderung im Technologiebereich zu äußern. Sprechen Sie den Lernenden stets mit 'Sie' an. Ihre Aufgabe ist es, das Gespräch aktiv zu lenken, indem Sie auf die Beiträge des Lernenden eingehen, präzisierende Fragen stellen und ihn/sie schrittweise durch die gestellten Aufgaben führen, um tiefere Analysen, Argumente und Lösungsansätze zu fördern. Achten Sie auf eine anspruchsvolle, flüssige Kommunikation auf C1-Niveau. Ihre erste Äußerung ist: \"Guten Tag! Ich bin gespannt, welche Diskussionen uns heute noch erwarten. Gerade beim Thema 'Ethik und Technologie' finde ich es essenziell, spezifische Beispiele zu beleuchten. Gibt es eine bestimmte neue Technologie, die Sie persönlich am meisten hinsichtlich ihrer ethischen Implikationen beschäftigt?\"",
        "missions": [
            {
                "id": "m1",
                "text": "Trình bày quan điểm của bạn về một công nghệ mới cụ thể (ví dụ: AI, công nghệ sinh học, tự động hóa) và những vấn đề đạo đức mà nó đặt ra."
            },
            {
                "id": "m2",
                "text": "Thảo luận về những rủi ro và lợi ích tiềm tàng của công nghệ đó đối với xã hội, đồng thời đề xuất các nguyên tắc đạo đức để quản lý nó."
            },
            {
                "id": "m3",
                "text": "Đề xuất các giải pháp hoặc khuôn khổ (pháp lý, xã hội, giáo dục) để đảm bảo công nghệ được phát triển và sử dụng một cách có trách nhiệm."
            }
        ]
    },
    {
        "id": "pr_crisis_food_recall",
        "title": "Quản lý Khủng hoảng PR: Thu hồi Sản phẩm Thực phẩm",
        "description": "Bạn là một thành viên cấp cao trong đội ngũ PR của một công ty thực phẩm lớn. Một sản phẩm chủ lực vừa bị phát hiện nhiễm khuẩn và phải thu hồi khẩn cấp, gây ra làn sóng chỉ trích mạnh mẽ từ truyền thông và công chúng. Bạn cần hợp tác với Trưởng phòng PR để xây dựng chiến lược ứng phó khủng hoảng hiệu quả.",
        "icon": "🚨",
        "category": "Xử lý Khủng hoảng PR",
        "targetLevels": [
            "C1"
        ],
        "systemPrompt": "Guten Tag, Herr/Frau [Learner's Name]. Ich hoffe, Sie sind bereit, denn wir stecken mitten in einer ausgewachsenen PR-Krise. Die Nachricht über den Rückruf unseres 'Premium-Müslis' wegen der Keimbelastung hat sich wie ein Lauffeuer verbreitet, und die Medien laufen Sturm. Bevor wir ins Detail gehen, wie schätzen Sie die aktuelle Situation ein und welche sind aus Ihrer Sicht die dringendsten Maßnahmen, die wir jetzt ergreifen müssen, um den Imageschaden zu begrenzen?",
        "missions": [
            {
                "id": "m1",
                "text": "Phân tích tình hình khủng hoảng và đánh giá mức độ nghiêm trọng của sự việc."
            },
            {
                "id": "m2",
                "text": "Đề xuất các bước hành động khẩn cấp và thông điệp truyền thông ban đầu."
            },
            {
                "id": "m3",
                "text": "Xây dựng kế hoạch dài hạn để khôi phục uy tín và niềm tin của khách hàng."
            }
        ]
    }
];
