// Ticket terms and privacy notice, in English and Mongolian.
// Edit the text here; the /terms page and the checkout checkbox pick it up.

type Bilingual = { en: string; mn: string };
const b = (en: string, mn: string): Bilingual => ({ en, mn });

export const TERMS_UPDATED = b('Last updated: 10 October 2026', 'Сүүлд шинэчилсэн: 2026 оны 10-р сарын 10');

export interface TermsSection {
  id: string;
  title: Bilingual;
  points: Bilingual[];
}

export const termsSections: TermsSection[] = [
  {
    id: 'tickets',
    title: b('1. Tickets and payment', '1. Тасалбар ба төлбөр'),
    points: [
      b('Each ticket is for one specific seat at TEDxUlaanbaatar Empathy School Youth on Sunday, 25 October 2026, at MONTE Ballroom, Ulaanbaatar.', 'Тасалбар бүр нь 2026 оны 10-р сарын 25-нд (Ням гараг) Улаанбаатар хотын МОНТЕ Боллрумд болох TEDxUlaanbaatar Empathy School Youth арга хэмжээний нэг тодорхой суудалд хамаарна.'),
      b('Payment is made online with QPay through our payment provider, Bonum. Your seat is confirmed only after the payment is received and you see the confirmation page.', 'Төлбөрийг манай төлбөрийн үйлчилгээ үзүүлэгч Bonum-оор дамжуулан QPay-ээр онлайнаар хийнэ. Төлбөр орж, баталгаажуулах хуудас гарсны дараа л таны суудал баталгаажна.'),
      b('When you start checkout, your seat is held for 15 minutes. If payment is not completed in that time, the seat is released for others.', 'Төлбөр төлж эхлэхэд таны суудал 15 минут хадгалагдана. Энэ хугацаанд төлбөр хийгдээгүй бол суудал бусдад чөлөөлөгдөнө.'),
    ],
  },
  {
    id: 'refunds',
    title: b('2. No refunds', '2. Төлбөр буцаагдахгүй'),
    points: [
      b('All ticket sales are final. Once a ticket is bought, it is non-refundable and cannot be exchanged, including if you are unable to attend.', 'Худалдан авсан тасалбарын төлбөр буцаагдахгүй бөгөөд солих боломжгүй. Үүнд та арга хэмжээнд ирж чадахгүй болсон тохиолдол мөн хамаарна.'),
      b('If the organizers cancel the event, we will refund the ticket price. If the date, time or venue changes, your ticket stays valid for the new arrangement.', 'Зохион байгуулагчид арга хэмжээг цуцалбал тасалбарын төлбөрийг буцааж олгоно. Хэрэв огноо, цаг эсвэл байршил өөрчлөгдвөл таны тасалбар шинэ хуваарийн дагуу хүчинтэй хэвээр байна.'),
      b('If you are charged twice by mistake, or your payment arrives after your seat was sold to someone else, contact us and we will refund the extra payment or offer another seat.', 'Хэрэв төлбөр алдаагаар давхар орсон, эсвэл таны суудал өөр хүнд зарагдсаны дараа төлбөр орсон бол бидэнтэй холбогдоно уу. Илүү төлөгдсөн төлбөрийг буцааж олгох эсвэл өөр суудал санал болгоно.'),
    ],
  },
  {
    id: 'transfers',
    title: b('3. Transfers and entry', '3. Шилжүүлэх ба орох'),
    points: [
      b('A ticket is linked to the name given at checkout. To pass your seat to someone else, email us at least 24 hours before the event with the new name.', 'Тасалбар нь худалдан авахдаа бичсэн нэр дээр бүртгэгдэнэ. Суудлаа өөр хүнд шилжүүлэх бол арга хэмжээ эхлэхээс дор хаяж 24 цагийн өмнө шинэ хүний нэрийг бидэнд и-мэйлээр мэдэгдэнэ үү.'),
      b('Reselling tickets for a higher price is not allowed.', 'Тасалбарыг илүү үнээр дахин зарахыг хориглоно.'),
      b('Bring your name and payment reference (shown on the confirmation page) to registration. Registration runs 09:30 to 10:15; please arrive on time.', 'Бүртгэл дээр нэр болон төлбөрийн лавлах дугаараа (баталгаажуулах хуудсанд харагдана) хэлнэ үү. Бүртгэл 09:30-10:15 цагт явагдана, цагтаа ирнэ үү.'),
    ],
  },
  {
    id: 'event',
    title: b('4. At the event', '4. Арга хэмжээний үеэр'),
    points: [
      b('Speakers and the programme may change. Programme changes are not a reason for a refund.', 'Илтгэгчид болон хөтөлбөр өөрчлөгдөж болно. Хөтөлбөрийн өөрчлөлт нь төлбөр буцаах үндэслэл болохгүй.'),
      b('The event is photographed and filmed. Talks may be published online, including on TEDx channels. By attending, you agree that you may appear in audience photos and videos.', 'Арга хэмжээний үеэр зураг болон бичлэг хийгдэнэ. Илтгэлүүд TEDx-ийн сувгууд зэрэг онлайнаар нийтлэгдэж болно. Арга хэмжээнд оролцсоноор та үзэгчдийн зураг, бичлэгт гарч болохыг зөвшөөрч байна.'),
      b('Please respect the speakers and other guests. The organizers may refuse entry or ask anyone who disrupts the event to leave, without a refund.', 'Илтгэгчид болон бусад зочдыг хүндэтгэнэ үү. Арга хэмжээг үймүүлсэн хүнийг зохион байгуулагчид оруулахгүй эсвэл гаргах эрхтэй бөгөөд төлбөр буцаагдахгүй.'),
      b('Buyers under 18 should have permission from a parent or guardian.', '18 насанд хүрээгүй худалдан авагч эцэг эх эсвэл асран хамгаалагчийнхаа зөвшөөрлийг авсан байх ёстой.'),
    ],
  },
  {
    id: 'privacy',
    title: b('5. Privacy', '5. Хувийн мэдээлэл'),
    points: [
      b('When you buy a ticket we collect your name, phone number, email, school or class, your seat number and the payment status.', 'Тасалбар худалдан авахад бид таны нэр, утасны дугаар, и-мэйл, сургууль эсвэл анги, суудлын дугаар болон төлбөрийн төлөвийг цуглуулна.'),
      b('We use this only to manage your ticket, check you in, and contact you about the event. We do not sell your information or share it for advertising.', 'Бид энэ мэдээллийг зөвхөн таны тасалбарыг бүртгэх, арга хэмжээнд оруулах болон арга хэмжээтэй холбоотой мэдээлэл өгөхөд ашиглана. Таны мэдээллийг зарахгүй, зар сурталчилгаанд ашиглуулахгүй.'),
      b('Payments are processed by Bonum and QPay. We never see or store your bank or card details.', 'Төлбөрийг Bonum болон QPay боловсруулна. Бид таны банк эсвэл картын мэдээллийг хэзээ ч харахгүй, хадгалахгүй.'),
      b('Your information is stored in a secure database that only the organizing team can access, and is deleted within 3 months after the event.', 'Таны мэдээлэл зөвхөн зохион байгуулах баг хандах боломжтой аюулгүй мэдээллийн санд хадгалагдах бөгөөд арга хэмжээ дууссанаас хойш 3 сарын дотор устгагдана.'),
      b('You can ask us to see, correct or delete your information at any time by email.', 'Та өөрийн мэдээллийг харах, засах эсвэл устгуулах хүсэлтээ хүссэн үедээ и-мэйлээр илгээж болно.'),
    ],
  },
  {
    id: 'about',
    title: b('6. About this event', '6. Арга хэмжээний тухай'),
    points: [
      b('TEDxUlaanbaatar Empathy School Youth is an independently organized TEDx event, operated under license from TED, and is run by student organizers at Ulaanbaatar Empathy School.', 'TEDxUlaanbaatar Empathy School Youth нь TED-ийн тусгай зөвшөөрлийн дагуу бие даан зохион байгуулагдаж буй TEDx арга хэмжээ бөгөөд Улаанбаатар Эмпати Сургуулийн сурагчид зохион байгуулж байна.'),
      b('We may update these terms. The version on this page at the time of your purchase applies to your ticket.', 'Бид эдгээр нөхцөлийг шинэчилж болно. Таны тасалбарт худалдан авсан үед энэ хуудсанд байсан хувилбар хамаарна.'),
    ],
  },
];
