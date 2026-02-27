import { Link } from 'react-router-dom';
import { RiwaqHeader } from '../components/RiwaqHeader';
import { RiwaqFooter } from '../components/RiwaqFooter';
import { Play, BookOpen, Award, Users } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function RiwaqHomePage() {
  const featuredCourses = [
    {
      id: 1,
      title: 'أساسيات البرمجة بلغة Python',
      description: 'تعلم البرمجة من الصفر حتى الاحتراف مع أمثلة عملية',
      price: '299 د.ل',
      duration: '12 ساعة',
      lessons: 45,
      thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&h=300&fit=crop',
    },
    {
      id: 2,
      title: 'تصميم واجهات المستخدم UI/UX',
      description: 'تعلم كيفية تصميم واجهات مستخدم جذابة وفعالة',
      price: '399 د.ل',
      duration: '15 ساعة',
      lessons: 52,
      thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=300&fit=crop',
    },
    {
      id: 3,
      title: 'التسويق الإلكتروني الشامل',
      description: 'دورة متكاملة في التسويق الرقمي ووسائل التواصل',
      price: '349 د.ل',
      duration: '10 ساعات',
      lessons: 38,
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=300&fit=crop',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 theme-transition">
      <RiwaqHeader currentPage="home" />

      <main className="flex-1">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-16 md:py-24
          bg-gradient-to-br from-[#2d2468] via-[#3B2F82] to-[#6467AD]
          dark:bg-gradient-to-br dark:from-slate-950 dark:via-[#1a1640] dark:to-[#2d2468]
          text-white">

          {/* Decorative blobs — subtle in both modes */}
          <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/5" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              {/* Left copy */}
              <div className="flex flex-col gap-6 text-center lg:text-right">
                <h1 className="text-4xl md:text-5xl lg:text-6xl leading-tight font-bold text-white">
                  ابدأ رحلتك التعليمية مع{' '}
                  <span className="text-[#F3BD32]">رِواق</span>
                </h1>
                <p className="text-lg md:text-xl text-white/80 leading-relaxed">
                  منصة تعليمية عربية متخصصة في تقديم دورات فيديو عالية الجودة لتطوير مهاراتك المهنية والشخصية
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    to="/courses"
                    className="bg-[#F3BD32] text-[#1a1a1a] px-8 py-3 rounded-lg hover:bg-[#e0ab2a] transition-colors inline-flex items-center justify-center gap-2 font-medium"
                  >
                    <span>استكشف الدورات</span>
                    <Play size={20} />
                  </Link>
                  <a
                    href="#about"
                    className="bg-white/10 text-white border border-white/20 px-8 py-3 rounded-lg hover:bg-white/20 transition-colors inline-flex items-center justify-center backdrop-blur-sm"
                  >
                    تعرف على رِواق
                  </a>
                </div>
              </div>

              {/* Right stats panel */}
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#F3BD32]/10 rounded-2xl transform rotate-3" />
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20
                    dark:bg-slate-900/60 dark:border-slate-700/50">
                    <div className="grid grid-cols-2 gap-6">
                      {[
                        { num: '500+', label: 'دورة تعليمية' },
                        { num: '50K+', label: 'طالب مسجل' },
                        { num: '200+', label: 'مدرب محترف' },
                        { num: '4.8',  label: 'تقييم الطلاب' },
                      ].map((stat) => (
                        <div key={stat.label}
                          className="bg-white/10 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-6 text-center">
                          <div className="text-4xl mb-2 text-[#F3BD32] font-bold">{stat.num}</div>
                          <div className="text-sm text-white/80">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Featured Courses ──────────────────────────────────────────────── */}
        <section id="courses" className="py-16 bg-white dark:bg-slate-950 theme-transition">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl mb-4 text-gray-900 dark:text-white">
                الدورات المميزة
              </h2>
              <p className="text-gray-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                اختر من بين مجموعة واسعة من الدورات التعليمية المتخصصة
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700
                    rounded-xl overflow-hidden hover:shadow-lg dark:hover:shadow-slate-900/60
                    transition-all duration-300 theme-transition group"
                >
                  {/* Thumbnail */}
                  <div className="relative overflow-hidden aspect-video">
                    <ImageWithFallback
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 bg-[#F3BD32] rounded-full flex items-center justify-center">
                        <Play size={28} className="text-[#1a1a1a] mr-1" />
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    <h3 className="text-xl mb-2 text-gray-900 dark:text-white font-medium">
                      {course.title}
                    </h3>
                    <p className="text-gray-500 dark:text-slate-400 mb-4 line-clamp-2 text-sm">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-400 dark:text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <BookOpen size={15} />
                        {course.lessons} درس
                      </span>
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-[#3B2F82] dark:text-[#8478C9]">
                        {course.price}
                      </span>
                      <a
                        href={`#course-${course.id}`}
                        className="bg-[#3B2F82] dark:bg-[#8478C9] text-white px-5 py-2 rounded-lg
                          hover:opacity-90 transition-opacity text-sm"
                      >
                        عرض التفاصيل
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                to="/courses"
                className="inline-flex items-center justify-center
                  bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200
                  border border-gray-200 dark:border-slate-700
                  px-8 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700
                  transition-colors theme-transition"
              >
                عرض جميع الدورات
              </Link>
            </div>
          </div>
        </section>

        {/* ── Why Riwaq ─────────────────────────────────────────────────────── */}
        <section id="about" className="py-16 bg-gray-50 dark:bg-slate-900 theme-transition">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl mb-4 text-gray-900 dark:text-white">
                لماذا رِواق؟
              </h2>
              <p className="text-gray-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                نوفر لك تجربة تعليمية متميزة ومتكاملة
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700
                rounded-xl p-8 text-center hover:shadow-lg dark:hover:shadow-slate-900/60
                transition-all duration-300 theme-transition">
                <div className="w-16 h-16 bg-[#3B2F82]/10 dark:bg-[#8478C9]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={32} className="text-[#3B2F82] dark:text-[#8478C9]" />
                </div>
                <h3 className="text-xl mb-3 text-gray-900 dark:text-white font-medium">
                  محتوى عالي الجودة
                </h3>
                <p className="text-gray-500 dark:text-slate-400 leading-relaxed">
                  دورات مصممة بعناية من قبل خبراء متخصصين في مجالاتهم
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700
                rounded-xl p-8 text-center hover:shadow-lg dark:hover:shadow-slate-900/60
                transition-all duration-300 theme-transition">
                <div className="w-16 h-16 bg-[#F3BD32]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award size={32} className="text-[#F3BD32]" />
                </div>
                <h3 className="text-xl mb-3 text-gray-900 dark:text-white font-medium">
                  شهادات معتمدة
                </h3>
                <p className="text-gray-500 dark:text-slate-400 leading-relaxed">
                  احصل على شهادة إتمام معتمدة بعد إنهاء كل دورة تدريبية
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700
                rounded-xl p-8 text-center hover:shadow-lg dark:hover:shadow-slate-900/60
                transition-all duration-300 theme-transition">
                <div className="w-16 h-16 bg-[#6467AD]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={32} className="text-[#6467AD]" />
                </div>
                <h3 className="text-xl mb-3 text-gray-900 dark:text-white font-medium">
                  مجتمع تعليمي
                </h3>
                <p className="text-gray-500 dark:text-slate-400 leading-relaxed">
                  انضم إلى مجتمع من المتعلمين والخبراء لتبادل الخبرات
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <section className="py-16 relative overflow-hidden
          bg-gradient-to-br from-[#2d2468] via-[#3B2F82] to-[#6467AD]
          dark:bg-gradient-to-br dark:from-slate-950 dark:via-[#1a1640] dark:to-[#2d2468]
          text-white">

          <div className="pointer-events-none absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-white/5" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl md:text-4xl mb-4 text-white font-bold">
              ابدأ رحلتك التعليمية اليوم
            </h2>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              انضم إلى آلاف المتعلمين واحصل على وصول فوري لجميع الدورات التعليمية
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center
                bg-[#F3BD32] text-[#1a1a1a] font-medium
                px-10 py-4 rounded-lg hover:bg-[#e0ab2a] transition-colors text-lg"
            >
              سجل الآن مجاناً
            </Link>
          </div>
        </section>

      </main>

      <RiwaqFooter />
    </div>
  );
}
