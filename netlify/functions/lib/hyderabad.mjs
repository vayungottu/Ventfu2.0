const music = 'https://www.district.in/events/music-in-hyderabad-book-tickets';
const comedy = 'https://www.district.in/events/comedy-shows-in-hyderabad-book-tickets';
const workshops = 'https://www.district.in/activities/workshops-in-hyderabad';
const general = 'https://www.district.in/events/upcoming-events-in-hyderabad';
const weekend = 'https://www.siasat.com/hyderabad-weekend-guide-2026-events-happening-on-nov-67-3570162/';
const rows = [
 ['Band ABM Collective at Dune Bar & Kitchen','2026-11-07','20:00','Dune Bar & Kitchen, Jubilee Hills','Music','Free',music],
 ['Band Infusion: Live On Stage','2026-11-06','19:00','Grease Monkey, Jubilee Hills','Music','INR 99',music],
 ['Ram Miriyala Live at Grease Monkey','2026-11-07','19:00','Grease Monkey, Jubilee Hills','Music','INR 199 onwards',music],
 ['BAND RAAG','2026-11-21','21:00','Kompound, Nanakramguda','Music','Free',music],
 ['Trisha Vox Band','2026-11-06','21:30','Raasta, Hitech City','Music','INR 1000 onwards',music],
 ['Mana Jams - Telugu Jamming','2026-11-14','','Mindspace Social','Music','INR 299 onwards',music,'Multiple dates from November 14; check available slots.'],
 ['ChinthaPandu','2026-11-07','21:00','The Street Comedy Club Hyderabad','Comedy','INR 249 onwards',comedy],
 ['Jathiratnalu','2026-11-22','19:00','The Street Comedy Club Hyderabad','Comedy','INR 249',comedy],
 ['Improv Scene Play','2026-11-14','16:00','Shepherd Stories','Comedy','INR 799',comedy],
 ['Arvind Sunder Live','2026-11-14','20:00','The Comedy Theatre, Hyderabad','Comedy','INR 399 onwards',comedy],
 ['3 AM Thoughts by Manjeet Thakur','2026-11-29','17:00','The Street Comedy Club Hyderabad','Comedy','INR 299',comedy],
 ['AIR 1 - A Standup Comedy Show by Harshit Mahawar','2026-12-27','18:00','The Comedy Theatre, Hyderabad','Comedy','INR 499',comedy],
 ['ZAR THE STAR: CALL CENTRE REVENGE','2026-12-18','20:00','The Comedy Theatre, Hyderabad','Comedy','INR 999 onwards',comedy],
 ['Sex Jokes Night','2026-11-06','','The Comedy Theatre, Hyderabad','Comedy','INR 299 onwards',comedy,'Multiple slots through November 13; check age restrictions and availability.','2026-11-13'],
 ['All Star Lineup - A Curated Stand Up Comedy Show','2026-11-06','','The Comedy Theatre, Hyderabad','Comedy','INR 299 onwards',comedy,'Multiple slots through November 13; check availability.','2026-11-13'],
 ['Telugu Stand Up Comedy - Open Mic','2026-11-06','20:30','Brew Commune Cafe & Bistro','Comedy','INR 99',comedy,'Listed every Friday, 8:30 PM to 10 PM; verify this occurrence.'],
 ['Scented Candle Making Workshop','2026-11-06','','De Cafe Studio','Art','INR 899','https://www.district.in/events/scented-candle-making-sep19-2026-buy-tickets','Daily multiple slots through November 30; select a session before booking.','2026-11-30'],
 ['The Crochet Heart Atelier','2026-11-07','','6-3-602/10/1, Hyderabad','Art','INR 1999 onwards',workshops,'Weekend sessions; check available dates and times.'],
 ['Mug Painting','2026-11-07','','Third Wave Coffee, Hyderabad','Art','INR 599',workshops,'Multiple dates from November 7; check branch and session.'],
 ['Paint Like Van Gogh','2026-11-07','','Third Wave Coffee, Hyderabad','Art','INR 599',workshops,'Multiple dates from November 7; check branch and session.'],
 ['Clay Jewelry Workshop','2026-11-07','','Third Wave Coffee, Hyderabad','Art','INR 799',workshops,'Multiple dates from November 7; check branch and session.'],
 ['Hand Made Pottery','2026-11-07','','Third Wave Coffee, Hyderabad','Art','INR 599',workshops,'Multiple dates from November 7; check branch and session.'],
 ['Clay Crafting on Mug','2026-11-07','','Third Wave Coffee, Hyderabad','Art','INR 699',workshops,'Multiple dates from November 7; check branch and session.'],
 ['Korean Glass Decal Workshop','2026-11-07','','Third Wave Coffee, Hyderabad','Art','INR 799',workshops,'Multiple dates from November 7; check branch and session.'],
 ['Japanese Plate Kintsugi','2026-11-07','','Third Wave Coffee, Hyderabad','Art','INR 799',workshops,'Multiple dates from November 7; check branch and session.'],
 ['DIY Clay Keychain','2026-11-07','','Third Wave Coffee, Hyderabad','Art','INR 699',workshops,'Multiple dates from November 7; check branch and session.'],
 ['Pottery Date','2026-11-07','','Third Wave Coffee, Hyderabad','Art','INR 599 onwards',workshops,'Multiple dates from November 7; check branch and session.'],
 ['Dancing Flowers Workshop','2026-11-07','','Third Wave Coffee, Hyderabad','Art','INR 699',workshops,'Multiple dates from November 7; check branch and session.'],
 ['Kahanibaaz by Ashish Vidyarthi','2026-11-07','19:30','KLN Prasad Auditorium - FTCCI','Other','INR 499 onwards',general],
 ['Jammers - Jamming Truly 12th Edition','2026-11-15','19:00','Bhaskara Auditorium','Music','INR 999',general],
 ['Heroine - A Storytelling Special by Gunjan Saini','2026-12-19','19:00','KLN Prasad Auditorium - FTCCI','Other','INR 499 onwards',general],
 ['Rugged Rush Hyderabad Edition','2026-12-13','07:00','Venue to be announced, Hyderabad','Sports','INR 2212 onwards',general],
 ['SBI Green Marathon S7 - Hyderabad','2026-12-20','05:00','HMDA Grounds','Sports','INR 1062 onwards',general],
 ['IFL: Diwali Fight Night - UFC Fight Pass Show','2026-11-06','18:30','See organizer for Hyderabad venue','Sports','Price TBA','https://www.district.in/events/sports-events-in-hyderabad-book-tickets'],
 ['Pizza Making Workshop','2026-11-06','','Broadway - New Age Department Store','Food','Price TBA','https://www.district.in/events/pizza-making-workshop-oct12-2026-buy-tickets','Multiple dates through November 23; choose an available session.','2026-11-23'],
 ['Happy Hands: Baking & Block Printing Workshop','2026-11-14','16:00','Chinnus Bake Studio','Art','Price TBA','https://www.district.in/events/happy-hands-baking-block-printing-nov14-2026-buy-tickets'],
 ['Hyderabad Book Fair 2026','2026-12-18','','NTR Stadium','Other','Price TBA','https://newsmeter.in/hyderabad/hyderabad-book-fair-2026-320-stalls-kids-events-and-cultural-programmes-from-dec-18-778544','Book stalls and literary programmes, December 18–28. Source is a news report, not registration.','2026-12-28'],
 ['Bollywood Night with DJs Srujith and Wildryde','2026-11-07','20:30','Peanuts Bar, HITEC City','Music','INR 500 onwards',weekend],
 ['Saturday Telugu Jamming at Silaa','2026-11-07','20:00','Silaa The Garden Cafe, Film Nagar','Music','Price TBA',weekend],
 ['Bollywood Express at Underdoggs','2026-11-07','20:00','Underdoggs, Raidurg','Music','INR 200 onwards',weekend]
];
export const catalog = rows.map(([title,date,time,venue,category,price,sourceUrl,note,endDate]) => ({ title,date,endDate: endDate || date,time: time || 'Time TBA',venue,category,price,sourceUrl,area:'Hyderabad, India',catalogNote:true,summary:`${title} at ${venue}. ${note || 'Check the source for current timings, entry conditions and booking availability.'}`,description:`Researched November 6, 2026. ${note || 'Date and venue as listed by the source.'} Prices and availability may change. For collection-page links, find this title on that page; news links are not registration pages.`,imageUrl:'' }));
