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
    <div className="min-h-screen flex flex-col">
      <RiwaqHeader currentPage="home" />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col gap-6 text-center lg:text-right">
                <h1 className="text-4xl md:text-5xl lg:text-6xl leading-tight">
                  ابدأ رحلتك التعليمية مع <span className="text-accent">رِواق</span>
                </h1>
                <p className="text-lg md:text-xl text-primary-foreground/90 leading-relaxed">
                  منصة تعليمية عربية متخصصة في تقديم دورات فيديو عالية الجودة لتطوير مهاراتك المهنية والشخصية
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    to="/courses"
                    className="bg-accent text-accent-foreground px-8 py-3 rounded-lg hover:bg-accent/90 transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <span>استكشف الدورات</span>
                    <Play size={20} />
                  </Link>
                  <a
                    href="#about"
                    className="bg-white/10 text-primary-foreground px-8 py-3 rounded-lg hover:bg-white/20 transition-colors inline-flex items-center justify-center backdrop-blur-sm"
                  >
                    {/* In-page scroll anchor – intentionally kept as <a> */}
                    تعرف على رِواق
                  </a>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-accent/20 rounded-2xl transform rotate-3"></div>
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                        <div className="text-4xl mb-2 text-accent">500+</div>
                        <div className="text-sm text-primary-foreground/80">دورة تعليمية</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                        <div className="text-4xl mb-2 text-accent">50K+</div>
                        <div className="text-sm text-primary-foreground/80">طالب مسجل</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                        <div className="text-4xl mb-2 text-accent">200+</div>
                        <div className="text-sm text-primary-foreground/80">مدرب محترف</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                        <div className="text-4xl mb-2 text-accent">4.8</div>
                        <div className="text-sm text-primary-foreground/80">تقييم الطلاب</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Courses */}
        <section id="courses" className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl mb-4">الدورات المميزة</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                اختر من بين مجموعة واسعة من الدورات التعليمية المتخصصة
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  <div className="relative overflow-hidden aspect-video">
                    <ImageWithFallback
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                        <Play size={28} className="text-accent-foreground mr-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl mb-2">{course.title}</h3>
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <BookOpen size={16} />
                        {course.lessons} درس
                      </span>
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl text-primary">{course.price}</span>
                      <a
                        href={`#course-${course.id}`}
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
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
                className="inline-flex items-center justify-center bg-secondary text-secondary-foreground px-8 py-3 rounded-lg hover:bg-secondary/90 transition-colors"
              >
                عرض جميع الدورات
              </Link>
            </div>
          </div>
        </section>

        {/* Platform Vision */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl mb-4">لماذا رِواق؟</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                نوفر لك تجربة تعليمية متميزة ومتكاملة
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card border border-border rounded-lg p-8 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={32} className="text-primary" />
                </div>
                <h3 className="text-xl mb-3">محتوى عالي الجودة</h3>
                <p className="text-muted-foreground leading-relaxed">
                  دورات مصممة بعناية من قبل خبراء متخصصين في مجالاتهم
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-8 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award size={32} className="text-accent" />
                </div>
                <h3 className="text-xl mb-3">شهادات معتمدة</h3>
                <p className="text-muted-foreground leading-relaxed">
                  احصل على شهادة إتمام معتمدة بعد إنهاء كل دورة تدريبية
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-8 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={32} className="text-secondary" />
                </div>
                <h3 className="text-xl mb-3">مجتمع تعليمي</h3>
                <p className="text-muted-foreground leading-relaxed">
                  انضم إلى مجتمع من المتعلمين والخبراء لتبادل الخبرات
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-primary to-secondary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl mb-4">ابدأ رحلتك التعليمية اليوم</h2>
            <p className="text-lg text-primary-foreground/90 mb-8 leading-relaxed">
              انضم إلى آلاف المتعلمين واحصل على وصول فوري لجميع الدورات التعليمية
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center bg-accent text-accent-foreground px-10 py-4 rounded-lg hover:bg-accent/90 transition-colors text-lg"
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
