import React from 'react';
import Navbar from '../components/Navbar';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">🎓 Talib</h3>
              <p className="text-gray-300">
                مجتمع الطلاب العرب الأول لتبادل الخبرات والتجارب الدراسية
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">روابط سريعة</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">الرئيسية</a></li>
                <li><a href="#" className="hover:text-white">شارك تجربتك</a></li>
                <li><a href="#" className="hover:text-white">التصنيفات</a></li>
                <li><a href="#" className="hover:text-white">عن المجتمع</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">تواصل معنا</h4>
              <p className="text-gray-300">
                لديك استفسار أو اقتراح؟<br />
                راسلنا على: info@talib.com
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2024 Talib. جميع الحقوق محفوظة | "لأن تجربة طالب قد تغيّر مستقبلك"</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
