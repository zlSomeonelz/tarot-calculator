const tarotDataKo = [
  {
    "id": 0,
    "name": "바보 (The Fool)",
    "suit": "Major Arcana",
    "keywords": ["시작", "자발성", "미숙함", "개방성"],
    "description": "가능성과 잠재력의 정점입니다. 수많은 선택지가 있음을 나타내지만 정보나 경험이 부족함을 암시합니다. 학습된 지식이 없을 때 직관을 믿으라는 메시지를 줍니다. [cite: 5, 11]"
  },
  {
    "id": 1,
    "name": "마법사 (Magician)",
    "suit": "Major Arcana",
    "keywords": ["창조", "현현", "권능", "의지"],
    "description": "행동, 집중력, 권능의 존재입니다. 네 가지 슈트(인간의 정체성)의 작용과 힘을 이해하는 사람을 나타냅니다. [cite: 23, 30, 31]"
  },
  {
    "id": 2,
    "name": "고위 여사제 (High Priestess)",
    "suit": "Major Arcana",
    "keywords": ["신비", "무의식", "비술적 지식", "직관"],
    "description": "마법사의 여성적 대응 존재로, 조용하고 사색적입니다. 정지된 시간, 조사, 그리고 밑바닥에 깔린 진실을 탐구하는 시기를 의미합니다. [cite: 41, 44, 45]"
  },
  {
    "id": 3,
    "name": "여황제 (Empress)",
    "suit": "Major Arcana",
    "keywords": ["어머니의 돌봄", "풍요", "즐거움", "관능"],
    "description": "모든 형태의 즐거움과 풍요의 화신입니다. 모성, 탄생, 그리고 지구와의 일체감을 나타냅니다. 그녀의 관대한 보답은 독점하는 것이 아니라 공유되어야 합니다. [cite: 56, 57, 58, 60]"
  },
  {
    "id": 4,
    "name": "황제 (Emperor)",
    "suit": "Major Arcana",
    "keywords": ["질서", "구조", "통제", "안전"],
    "description": "엄격하고 직접적이며 경직되어 있습니다. 규칙, 조직, 책임감을 통해 혼돈 속에서 질서를 창조합니다. 모든 시스템이 원활하게 작동하기 위한 필수 요소입니다. [cite: 69, 72, 75]"
  },
  {
    "id": 5,
    "name": "교황 (Hierophant)",
    "suit": "Major Arcana",
    "keywords": ["믿음", "협력", "공동체", "전통"],
    "description": "공유된 믿음과 팀워크를 통해 더 큰 것의 일부가 되라는 부름을 상징합니다. 집단을 통해 전해 내려오는 불멸의 아이디어의 힘을 나타냅니다. [cite: 84, 85, 88, 89]"
  },
  {
    "id": 6,
    "name": "연인 (Lovers)",
    "suit": "Major Arcana",
    "keywords": ["균형"],
    "description": "영혼을 묶는 붉은 운명의 실로 표현됩니다. 상반되지만 끌리는 힘과 두 가지 다른 경로 사이의 선택을 상징합니다. [cite: 100, 106]"
  },
  {
    "id": 7,
    "name": "전차 (Chariot)",
    "suit": "Major Arcana",
    "keywords": ["야망", "의지", "성공", "통제"],
    "description": "투쟁 뒤의 승리를 형상화한 것입니다. 자신을 다스리고 목표 달성을 위해 주변의 힘을 활용하는 것을 나타냅니다. [cite: 117, 121]"
  },
  {
    "id": 8,
    "name": "힘 (Strength)",
    "suit": "Major Arcana",
    "keywords": ["힘", "연민", "이해", "용기"],
    "description": "진정한 힘은 공격성보다는 확신과 다른 존재를 이해하려는 노력에 있습니다. 오해받는 자들에 대한 보호를 의미합니다. [cite: 135, 138, 140]"
  },
  {
    "id": 9,
    "name": "은둔자 (Hermit)",
    "suit": "Major Arcana",
    "keywords": ["탐구", "성찰", "고독", "멘토링"],
    "description": "문명에 가려진 진실을 찾기 위해 기꺼이 스스로를 고립시킵니다. 물리적인 문제보다 내면의 성장을 더 가치 있게 여깁니다. [cite: 153, 155]"
  },
  {
    "id": 10,
    "name": "운명 (Destiny)",
    "suit": "Major Arcana",
    "keywords": ["반전", "운명", "행운", "불가피함"],
    "description": "인간의 통제를 벗어난 알 수 없는 힘입니다. 운명의 수레바퀴를 대체하며, 인생을 바꾸는 사건들과 공동의 운명이 얽히는 것을 나타냅니다. [cite: 169, 170, 176, 177]"
  },
  {
    "id": 11,
    "name": "정의 (Justice)",
    "suit": "Major Arcana",
    "keywords": ["공정함", "치우침 없음", "업보", "명확함", "정의"],
    "description": "진실의 눈먼 중재자입니다. 개인적인 편견을 버리고 공정한 눈으로 행동을 바라보라는 호소입니다. [cite: 187, 189]"
  },
  {
    "id": 12,
    "name": "매달린 사람 (Hanged Man)",
    "suit": "Major Arcana",
    "keywords": ["항복", "믿음", "희생", "관점"],
    "description": "원칙이나 의지의 굴복입니다. 지는 것이 이기는 것이라는 깨달음을 주며, 예상치 못한 접근 방식을 취하는 것을 나타냅니다. [cite: 201, 202, 205]"
  },
  {
    "id": 13,
    "name": "죽음 (Death)",
    "suit": "Major Arcana",
    "keywords": ["끝", "진화", "변화", "필멸성"],
    "description": "변화와 한 장의 끝을 의미하는 동의어입니다. 진정으로 살기 위해 성장과 유연성의 필요성을 나타냅니다. [cite: 221, 229]"
  },
  {
    "id": 14,
    "name": "절제 (Temperance)",
    "suit": "Major Arcana",
    "keywords": ["균형", "배려", "수용", "타협"],
    "description": "극단 사이를 하나로 묶는 요소입니다. 욕망이 타인이나 자신에게 해를 끼치지 않도록 절제와 조절을 요구합니다. [cite: 233, 239]"
  },
  {
    "id": 15,
    "name": "악마 (Devil)",
    "suit": "Major Arcana",
    "keywords": ["유혹", "과잉", "기만", "물질주의"],
    "description": "자부심과 애착 같은 좋은 요소들을 옭아매는 힘으로 비틉니다. 아름답지만 덧없는 즐거움이라는 '자발적 감옥'을 나타냅니다. [cite: 251, 257]"
  },
  {
    "id": 16,
    "name": "탑 (Tower)",
    "suit": "Major Arcana",
    "keywords": ["변화", "격변", "위험", "통찰"],
    "description": "예상치 못한 불편한 변화입니다. 갑작스러운 사건을 통해 위대한 깨달음(에피파니)을 얻을 가능성을 상징합니다. [cite: 268, 274]"
  },
  {
    "id": 17,
    "name": "별 (Star)",
    "suit": "Major Arcana",
    "keywords": ["인도", "선의", "낙관주의", "희망"],
    "description": "어둠 속의 빛을 가져오는 존재입니다. 긍정적인 행운의 전환을 신호하며 길을 비추지만, 희망은 반드시 행동으로 이어져야 함을 강조합니다. [cite: 291, 294, 297]"
  },
  {
    "id": 18,
    "name": "달 (Moon)",
    "suit": "Major Arcana",
    "keywords": ["직관", "두려움", "환상", "영매"],
    "description": "힘을 얻기 위해 주변을 다른 시각으로 보라고 요구합니다. 영적인 능력을 탐구하는 이들에게 잠재적인 에너지가 흐르는 통로가 됩니다. [cite: 315, 316, 317]"
  },
  {
    "id": 19,
    "name": "태양 (Sun)",
    "suit": "Major Arcana",
    "keywords": ["통찰", "축하", "온기", "기쁨"],
    "description": "자기 확신과 자신감의 카드입니다. 그 빛은 그림자를 뚫고 진실을 드러내며 지적으로 깨우침을 줍니다. [cite: 332, 333]"
  },
  {
    "id": 20,
    "name": "심판 (Judgment)",
    "suit": "Major Arcana",
    "keywords": ["결정", "심판", "보상", "처벌"],
    "description": "행동과 의도의 정점입니다. 어떤 사람이나 프로젝트가 당신의 시간을 들일 가치가 있는지 명확하게 판단할 것을 요구합니다. [cite: 345, 351]"
  },
  {
    "id": 21,
    "name": "세계 (World)",
    "suit": "Major Arcana",
    "keywords": ["온전함", "완성", "여행", "이해"],
    "description": "바보의 여정의 결말입니다. 인간의 조건에 대한 완벽한 이해를 갖추고 새롭게 시작할 준비가 되었음을 나타냅니다. [cite: 362, 363, 365]"
  },
  {
    "id": 22,
    "name": "아난트 (Anant)",
    "suit": "Major Arcana",
    "keywords": ["끝없는", "무한한", "면제된", "순환하는"],
    "description": "시간적 제약 밖에 존재하는 존재입니다. 한 우주의 끝이 새로운 우주를 가져오는 영원의 순환적 특성을 나타냅니다. [cite: 376, 378, 382]"
  },
  {
    "id": 23,
    "name": "완드 에이스 (Ace of Wands)",
    "suit": "Wands",
    "keywords": ["창의성", "좋은 소식", "용기", "시작"],
    "description": "새로운 방향으로의 대담한 발걸음이자 창의적인 기회입니다. [cite: 409, 412]"
  },
  {
    "id": 24,
    "name": "완드 2 (Two of Wands)",
    "suit": "Wands",
    "keywords": ["대담함", "영향력", "개척", "결정"],
    "description": "미지의 세계를 탐험하려는 야망으로, 머무를 것인지 떠날 것인지에 대한 선택을 의미합니다. [cite: 422, 423]"
  },
  {
    "id": 25,
    "name": "완드 3 (Three of Wands)",
    "suit": "Wands",
    "keywords": ["탐험", "리더십", "여행", "모험"],
    "description": "리더십을 발휘하여 추종자들을 위해 앞길을 개척하는 모습입니다. [cite: 428, 429]"
  },
  {
    "id": 26,
    "name": "완드 4 (Four of Wands)",
    "suit": "Wands",
    "keywords": ["축하", "자유", "가능성", "행사"],
    "description": "정신적 또는 육체적 속박에서 벗어난 후의 행복을 나타냅니다. [cite: 438, 439, 440]"
  },
  {
    "id": 27,
    "name": "완드 5 (Five of Wands)",
    "suit": "Wands",
    "keywords": ["갈등", "경쟁", "대립", "짜증"],
    "description": "치열한 경쟁이나 일상의 짜증나는 일들로 인해 패배감을 느끼는 상태입니다. [cite: 446, 450]"
  },
  {
    "id": 28,
    "name": "완드 6 (Six of Wands)",
    "suit": "Wands",
    "keywords": ["자부심", "영광", "존중"],
    "description": "장애물을 극복한 성공으로, 승리와 명성을 즐기는 시기입니다. [cite: 453, 458, 459]"
  },
  {
    "id": 29,
    "name": "완드 7 (Seven of Wands)",
    "suit": "Wands",
    "keywords": ["영토 수호", "방어적", "신념", "저항"],
    "description": "강한 신념이나 입장을 반대자들에 맞서 굳건히 지키는 모습입니다. [cite: 465, 466]"
  },
  {
    "id": 30,
    "name": "완드 8 (Eight of Wands)",
    "suit": "Wands",
    "keywords": ["메시지", "행동", "속도", "흥분"],
    "description": "빠른 사고와 적응력이 요구되는 갑작스러운 소식이 들려오는 시기입니다. [cite: 471, 474]"
  },
  {
    "id": 31,
    "name": "완드 9 (Nine of Wands)",
    "suit": "Wands",
    "keywords": ["경계", "조심스러운", "오해받은", "인내"],
    "description": "과거의 상처로 인해 조심스럽지만, 여전히 버티고 있으며 회복할 능력이 있음을 보여줍니다. [cite: 480, 482, 485]"
  },
  {
    "id": 32,
    "name": "완드 10 (Ten of Wands)",
    "suit": "Wands",
    "keywords": ["압도된", "부담스러운", "고군분투", "목표가 가깝지만 힘겨움"],
    "description": "감당하기 힘든 일을 떠맡아 책임이 불균형하게 몰린 상태입니다. [cite: 489, 492]"
  },
  {
    "id": 33,
    "name": "완드 페이지 (Page of Wands)",
    "suit": "Wands",
    "keywords": ["모험적인", "예상치 못한", "흥미로운", "혁신적인"],
    "description": "새로운 영역을 횡단하며, 준비된 무모함으로 위험을 감수하는 모습입니다. [cite: 501, 502, 504]"
  },
  {
    "id": 34,
    "name": "완드 나이트 (Knight of Wands)",
    "suit": "Wands",
    "keywords": ["성급한", "열정적인", "용감한", "무뚝뚝한"],
    "description": "추진력과 화려함을 보여주지만, 계획 없는 용기에 대해서는 주의를 줍니다. [cite: 507, 509, 512]"
  },
  {
    "id": 35,
    "name": "완드 퀸 (Queen of Wands)",
    "suit": "Wands",
    "keywords": ["아름다운", "공감적인", "자신감 있는", "낙관적인"],
    "description": "조용한 확신으로 가득 차 있으며, 다양한 취미와 관심사로 활기 넘치는 삶을 나타냅니다. [cite: 516, 517, 518]"
  },
  {
    "id": 36,
    "name": "완드 킹 (King of Wands)",
    "suit": "Wands",
    "keywords": ["지휘하는", "고무적인", "단결시키는", "창의적인"],
    "description": "카리스마로 다른 이들을 결집시키며 확신을 가지고 새로운 길을 개척합니다. [cite: 522, 525]"
  },
  {
    "id": 37,
    "name": "컵 에이스 (Ace of Cups)",
    "suit": "Cups",
    "keywords": ["사랑", "공감", "유대", "풍요"],
    "description": "공감 능력이 커지는 시기로, 어려움 속에서도 사랑을 베푸는 성숙한 애정을 의미합니다. [cite: 531, 538]"
  },
  {
    "id": 38,
    "name": "컵 2 (Two of Cups)",
    "suit": "Cups",
    "keywords": ["연결", "파트너십", "결합", "로맨스"],
    "description": "신뢰에 기반한 끌림이나 깊은 우정으로, 적대감의 종식을 의미하기도 합니다. [cite: 542, 545]"
  },
  {
    "id": 39,
    "name": "컵 3 (Three of Cups)",
    "suit": "Cups",
    "keywords": ["축하", "우정", "지원", "유대"],
    "description": "신뢰와 짐을 나누는 연대감이며, 기쁨과 휴식의 시간입니다. [cite: 547, 550, 553]"
  },
  {
    "id": 40,
    "name": "컵 4 (Four of Cups)",
    "suit": "Cups",
    "keywords": ["회피", "수동적", "내성적", "숨겨진"],
    "description": "무관심하거나 성찰과 꿈을 위해 의도적으로 물러나 있는 상태입니다. [cite: 559, 562]"
  },
  {
    "id": 41,
    "name": "컵 5 (Five of Cups)",
    "suit": "Cups",
    "keywords": ["상실", "패배", "슬픔", "어려움"],
    "description": "프로젝트나 관계의 실패이지만, 이것이 지나갈 것이라는 희망을 놓지 않는 상태입니다. [cite: 567, 569]"
  },
  {
    "id": 42,
    "name": "컵 6 (Six of Cups)",
    "suit": "Cups",
    "keywords": ["순수함", "천진난만", "자선", "다정함"],
    "description": "어린 시절의 추억에 대한 애정입니다. 다만 과거에 지나치게 탐닉하지 않도록 주의가 필요합니다. [cite: 573, 576]"
  },
  {
    "id": 43,
    "name": "컵 7 (Seven of Cups)",
    "suit": "Cups",
    "keywords": ["환상", "몽상", "환영", "미루기"],
    "description": "창의적이지만 우유부단함에 대해 경고합니다. 행동 없이는 꿈이 연기처럼 사라질 수 있습니다. [cite: 584, 587, 589]"
  },
  {
    "id": 44,
    "name": "컵 8 (Eight of Cups)",
    "suit": "Cups",
    "keywords": ["발견", "여정", "고독", "떠나감"],
    "description": "낡은 것을 벗어나 충만했던 과거를 뒤로 하고 새로운 발견을 위해 나아가는 모습입니다. [cite: 594, 595, 596]"
  },
  {
    "id": 45,
    "name": "컵 9 (Nine of Cups)",
    "suit": "Cups",
    "keywords": ["방종", "풍요", "만족", "편안함"],
    "description": "소원이 이루어지는 카드로, 사회적 활동에서 보상과 번영을 수확하는 시기입니다. [cite: 602, 605]"
  },
  {
    "id": 46,
    "name": "컵 10 (Ten of Cups)",
    "suit": "Cups",
    "keywords": ["행복", "성숙", "화합", "용서"],
    "description": "정서적 성장으로, 평화를 위해 과거의 허물을 용서하고 화합하는 모습입니다. [cite: 609, 614]"
  },
  {
    "id": 47,
    "name": "컵 페이지 (Page of Cups)",
    "suit": "Cups",
    "keywords": ["부드러운", "희망적인", "어린아이 같은", "돌보는"],
    "description": "사랑의 메시지로, 고무적인 활기로 잠재적인 우정을 키워나가는 모습입니다. [cite: 618, 621]"
  },
  {
    "id": 48,
    "name": "컵 나이트 (Knight of Cups)",
    "suit": "Cups",
    "keywords": ["감정적인", "생각에 잠긴", "예술적인", "꿈꾸는"],
    "description": "민감한 몽상가로, 무한한 사고방식과 개방성을 지니고 있지만 실행력이 필요합니다. [cite: 624, 626, 629]"
  },
  {
    "id": 49,
    "name": "컵 퀸 (Queen of Cups)",
    "suit": "Cups",
    "keywords": ["직관적인", "이해심 많은", "보살피는", "상냥한"],
    "description": "심장과 직관을 따르는 삶이며, 타인의 감정 상태를 깊이 이해합니다. [cite: 635, 636]"
  },
  {
    "id": 50,
    "name": "컵 킹 (King of Cups)",
    "suit": "Cups",
    "keywords": ["침착한", "외교적인", "절제된", "냉정한"],
    "description": "냉철함과 외교적 수완으로 폭풍우 같은 상황에서도 평정심을 유지합니다. [cite: 645, 646]"
  },
  {
    "id": 51,
    "name": "소드 에이스 (Ace of Swords)",
    "suit": "Swords",
    "keywords": ["진실", "추론", "객관성", "돌파구"],
    "description": "순수한 지성으로 혼란을 걷어내고 팩트로 바로 파고드는 명료함입니다. [cite: 653, 656]"
  },
  {
    "id": 52,
    "name": "소드 2 (Two of Swords)",
    "suit": "Swords",
    "keywords": ["차단된", "회피", "막힘", "거부"],
    "description": "행동이 필요한 상황에서 선택을 거부하는 것 역시 하나의 선택임을 보여줍니다. [cite: 660, 664]"
  },
  {
    "id": 53,
    "name": "소드 3 (Three of Swords)",
    "suit": "Swords",
    "keywords": ["비탄", "해방", "교훈", "고립"],
    "description": "예상치 못한 상실감을 치유하고 상심으로부터 배우라는 부름입니다. [cite: 671, 675]"
  },
  {
    "id": 54,
    "name": "소드 4 (Four of Swords)",
    "suit": "Swords",
    "keywords": ["휴식", "활력 증진", "준비", "치유"],
    "description": "이전의 노력으로부터 재충전하거나 다가올 스트레스에 대비하는 모습입니다. [cite: 680, 683]"
  },
  {
    "id": 55,
    "name": "소드 5 (Five of Swords)",
    "suit": "Swords",
    "keywords": ["이기적인", "범죄적인", "비도덕적", "갈등"],
    "description": "타인을 이용하거나 집단의 활력을 앗아가는 부적절한 행동에 대한 경고입니다. [cite: 690, 691]"
  },
  {
    "id": 56,
    "name": "소드 6 (Six of Swords)",
    "suit": "Swords",
    "keywords": ["피로", "낙담", "무기력", "전환기"],
    "description": "알 수 없는 잿빛 미래를 향해 나아가며 잠시 무기력하게 멈춰 선 모습입니다. [cite: 698, 703]"
  },
  {
    "id": 57,
    "name": "소드 7 (Seven of Swords)",
    "suit": "Swords",
    "keywords": ["배신", "절도", "책략", "불명예"],
    "description": "충성심과 명예가 사라진 파괴적인 상황을 나타냅니다. [cite: 709, 711]"
  },
  {
    "id": 58,
    "name": "소드 8 (Eight of Swords)",
    "suit": "Swords",
    "keywords": ["시험", "시련", "스트레스", "박해"],
    "description": "스트레스가 많은 환경이지만, 이를 통해 더 강해지거나 무너질 수 있는 기로입니다. [cite: 718, 720]"
  },
  {
    "id": 59,
    "name": "소드 9 (Nine of Swords)",
    "suit": "Swords",
    "keywords": ["악몽", "공포", "절망", "걱정"],
    "description": "희망의 상실로, 현실보다 마음속의 꿈이나 생각이 더 무서운 상태입니다. [cite: 726, 732, 733]"
  },
  {
    "id": 60,
    "name": "소드 10 (Ten of Swords)",
    "suit": "Swords",
    "keywords": ["위기", "붕괴", "인내", "마무리지음"],
    "description": "동트기 전의 어둠입니다. 이야기가 어둠 속에서 끝나지 않도록 인내가 필요합니다. [cite: 737, 741]"
  },
  {
    "id": 61,
    "name": "소드 페이지 (Page of Swords)",
    "suit": "Swords",
    "keywords": ["진실", "결의", "명료함", "솔직함"],
    "description": "문제에 정면으로 맞서며 좌절 앞에서도 진실을 추구하는 모습입니다. [cite: 745, 749]"
  },
  {
    "id": 62,
    "name": "소드 나이트 (Knight of Swords)",
    "suit": "Swords",
    "keywords": ["날카로운", "직설적", "논리적", "기민한"],
    "description": "지성을 통한 강한 추진력으로, 감정을 배제하고 혼란을 뚫고 지나갑니다. [cite: 754, 756]"
  },
  {
    "id": 63,
    "name": "소드 퀸 (Queen of Swords)",
    "suit": "Swords",
    "keywords": ["정의로운", "직설적인", "정직한", "날카로운"],
    "description": "사실과 경험에 근거한 지식이며, 때로는 진실이 상처가 될 수 있음을 압니다. [cite: 763, 766]"
  },
  {
    "id": 64,
    "name": "소드 킹 (King of Swords)",
    "suit": "Swords",
    "keywords": ["지휘하는", "분석적인", "공정한", "창의적인"],
    "description": "치밀하고 냉철한 판단력을 지녔지만, 오로지 논리적일 경우 스스로를 해칠 수도 있습니다. [cite: 773, 776, 777]"
  },
  {
    "id": 65,
    "name": "펜타클 에이스 (Ace of Pentacles)",
    "suit": "Pentacles",
    "keywords": ["실용성", "노동", "부", "안정"],
    "description": "투자의 결실로, 수고스러운 노동을 통해 기반을 닦는 모습입니다. [cite: 781, 783]"
  },
  {
    "id": 66,
    "name": "펜타클 2 (Two of Pentacles)",
    "suit": "Pentacles",
    "keywords": ["재미", "우유부단", "조율", "금융"],
    "description": "변화하는 관심사들 사이의 균형 잡기이며, 재정적 불안정에 대한 경고를 담고 있습니다. [cite: 791, 793]"
  },
  {
    "id": 67,
    "name": "펜타클 3 (Three of Pentacles)",
    "suit": "Pentacles",
    "keywords": ["헌신", "성장", "팀워크", "시너지"],
    "description": "서로의 강점을 활용하며 신중한 고려와 계획을 세우는 모습입니다. [cite: 798, 802]"
  },
  {
    "id": 68,
    "name": "펜타클 4 (Four of Pentacles)",
    "suit": "Pentacles",
    "keywords": ["축적", "탐욕", "물질주의", "정체"],
    "description": "변화하지 못하고 움켜쥐고 있는 상태입니다. 재물은 순환되어야 가치가 있습니다. [cite: 808, 810, 811]"
  },
  {
    "id": 69,
    "name": "펜타클 5 (Five of Pentacles)",
    "suit": "Pentacles",
    "keywords": ["고난", "거부", "가난", "질병"],
    "description": "재산이나 건강상의 일시적인 어려움이며, 필요할 때 도움을 구해야 함을 보여줍니다. [cite: 817, 819]"
  },
  {
    "id": 70,
    "name": "펜타클 6 (Six of Pentacles)",
    "suit": "Pentacles",
    "keywords": ["불평등", "지배", "평가", "대조"],
    "description": "어느 한쪽이 더 많은 권한을 가진 상태로, 권력이 지배나 나눔으로 쓰임을 나타냅니다. [cite: 828, 829]"
  },
  {
    "id": 71,
    "name": "펜타클 7 (Seven of Pentacles)",
    "suit": "Pentacles",
    "keywords": ["휴식", "자부심", "보상", "평가"],
    "description": "목표나 이정표에 도달한 후, 휴식하며 현재의 위치를 평가하는 시기입니다. [cite: 833, 834, 838]"
  },
  {
    "id": 72,
    "name": "펜타클 8 (Eight of Pentacles)",
    "suit": "Pentacles",
    "keywords": ["공예", "노력", "품질", "근면"],
    "description": "지속적인 노력이 필요하며 지식을 넓히고 한계를 뛰어넘는 시기입니다. [cite: 843, 845]"
  },
  {
    "id": 73,
    "name": "펜타클 9 (Nine of Pentacles)",
    "suit": "Pentacles",
    "keywords": ["절제", "풍요", "럭셔리"],
    "description": "과시용이 아닌 자신을 위한 품격 있는 풍요를 즐기는 모습입니다. [cite: 850, 853, 854]"
  },
  {
    "id": 74,
    "name": "펜타클 10 (Ten of Pentacles)",
    "suit": "Pentacles",
    "keywords": ["번영", "안정", "가족", "장수"],
    "description": "지속적인 부와 번영이며, 가족과 관계, 그리고 지혜를 키우는 데 집중합니다. [cite: 859, 861]"
  },
  {
    "id": 75,
    "name": "펜타클 페이지 (Page of Pentacles)",
    "suit": "Pentacles",
    "keywords": ["주도권", "실용적인", "육체적인", "세속적인"],
    "description": "활동적인 것에 대한 애정이며, 주도적인 태도가 성공으로 이어집니다. [cite: 867, 869, 871]"
  },
  {
    "id": 76,
    "name": "펜타클 나이트 (Knight of Pentacles)",
    "suit": "Pentacles",
    "keywords": ["준비된", "확고한", "헌신적인", "신중한"],
    "description": "치밀한 준비와 끈기, 그리고 일에 대한 엄청난 체력을 나타냅니다. [cite: 874, 878, 879]"
  },
  {
    "id": 77,
    "name": "펜타클 퀸 (Queen of Pentacles)",
    "suit": "Pentacles",
    "keywords": ["베푸는", "환대하는", "보살피는", "진실한"],
    "description": "정서적 필요에 의지가 되는 존재이며 세상의 실질적인 면을 잘 활용합니다. [cite: 884, 887]"
  },
  {
    "id": 78,
    "name": "펜타클 킹 (King of Pentacles)",
    "suit": "Pentacles",
    "keywords": ["기업가", "개척", "지원", "성공적인"],
    "description": "기회를 창출하며 물질적인 세계를 완전히 장악한 수준 높은 능력을 나타냅니다. [cite: 894, 895]"
  }
];
