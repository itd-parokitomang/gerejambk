# Aplikasi Paroki Tomang 🏛️

Aplikasi hybrid mobile-web untuk Paroki Santa Maria Bunda Karmel Tomang, Jakarta Barat.

![Platform](https://img.shields.io/badge/Platform-iOS%20|%20Android%20|%20Web-blue)
![Framework](https://img.shields.io/badge/Framework-Expo-000020?logo=expo)
![Backend](https://img.shields.io/badge/Backend-Firebase-FFCA28?logo=firebase)
![Database](https://img.shields.io/badge/Database-Firestore-FFCA28?logo=firebase)

## ✨ Fitur Utama

### MVP v1.0
- ✅ **Homepage SuperApp Style** - Slider full-width + Grid menu icons yang modern
- ✅ **5 Dummy Sliders** - Auto-play slider dengan pagination dots
- ✅ **6 Menu Icons** - Grid layout yang sleek dan modern:
  - Misa Gereja & Intensi Misa
  - Paroki Tomang - Gereja MBK
  - Pelayanan Gereja MBK
  - Renungan Harian Katolik
  - Kegiatan MBK Akan Datang
  - Kontak & Informasi
- ✅ **Admin Panel** - Login system dengan authentication
  - 
- ✅ **Cross-Platform** - Berjalan di iOS, Android, dan Web
- ✅ **PWA Ready** - Bisa di-install sebagai Progressive Web App
- ✅ **Modern UI** - Desain modern dengan color scheme coklat/orange

## 🎨 Design Philosophy

- **Modern & Sleek** - Interface yang bersih dan mudah digunakan
- **Touch-Friendly** - Optimized untuk mobile dengan touch targets yang besar
- **Responsive** - Adaptif di berbagai ukuran layar
- **Accessible** - Mudah digunakan untuk semua kalangan

## 🛠️ Tech Stack

### Frontend
- **Expo** (React Native) - Cross-platform mobile framework
- **React Native** - UI components
- **TypeScript** - Type-safe development
- **Expo Router** - File-based routing
- **AsyncStorage** - Local data persistence
- **Axios** - HTTP client

### Backend (Serverless)
- **Firebase Authentication** - Login & session management
- **Cloud Firestore** - Database utama
- **Firebase Security Rules** - Authorization & access control

## 📁 Struktur Proyek

```
app/
├── frontend/                 # Aplikasi Expo (React Native + Web) dengan Firebase
│   ├── app/                 # File-based routing
│   │   ├── index.tsx       # Homepage
│   │   ├── adm/            # Admin panel
│   │   │   ├── index.tsx   # Login page
│   │   │   └── dashboard.tsx  # Admin dashboard
│   │   ├── pages/          # Dynamic pages
│   │   │   └── [slug].tsx  # Placeholder pages
│   │   └── _layout.tsx     # Root layout
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication
│   ├── assets/             # Images & fonts
│   └── package.json
└── docs/                   # Dokumentasi arsitektur & setup
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Yarn

### Installation

1. **Clone & Install Dependencies**
```bash
cd frontend
yarn install
```

2. **Run Development (Expo)**

```bash
cd frontend
yarn start
```

3. **Access**
- Web: http://localhost:3000
- Mobile: Scan QR code dengan Expo Go app
- Admin: http://localhost:3000/adm

## 🔐 Admin Credentials

**Default Super Admin:**
- Email: `joni@email.com`
- Password: `joni2#Marjoni`

⚠️ **IMPORTANT**: Ganti credentials ini untuk production!

## 📱 Features Roadmap

### Phase 2 (Coming Soon)
- [ ] Manajemen Slider Banner dari Admin
- [ ] Upload & Edit banner images (base64)
- [ ] Set link untuk setiap slider (internal/external)
- [ ] Sorting dan activation slider

### Phase 3
- [ ] Manajemen Menu Icons dari Admin
- [ ] Custom icon selection
- [ ] Custom routing untuk setiap menu
- [ ] Add/Remove/Edit menu items

### Phase 4
- [ ] Content Management System
- [ ] Create/Edit Pages & Sub-pages
- [ ] Rich Text Editor
- [ ] Video embed (YouTube, Vimeo)
- [ ] WebView integration
- [ ] Image galleries

### Phase 5
- [ ] User Management
- [ ] Multiple admin accounts
- [ ] Role-based access control
- [ ] Activity logs

### Phase 6
- [ ] Push Notifications
- [ ] Jadwal Misa Management
- [ ] Event Calendar
- [ ] News & Announcements
- [ ] Prayer Requests

## 🧪 Testing

### Manual Testing

**Homepage:**
```bash
curl http://localhost:3000
```

## 📦 Deployment

Lihat `docs/setup.md` dan `docs/arsitektur.md` untuk panduan lengkap deployment ke:
- ✅ Vercel (Web)
- ✅ Netlify (Web)
- ✅ Expo EAS (Mobile)

## 🎨 Color Scheme

```javascript
Primary:     #8B4513  // Coklat Utama (Brown)
Secondary:   #D2691E  // Orange Coklat (Chocolate)
Background:  #FFF8F0  // Krem Lembut (Cornsilk)
Text:        #5D4037  // Coklat Tua (Brown-900)
Light:       #FFE4C4  // Bisque
Border:      #E0D5C7  // Light Brown
```

## 📸 Screenshots

### Homepage
- Modern slider dengan auto-play
- Grid menu yang sleek
- Responsive design

### Admin Panel
- Secure login system
- Clean dashboard
- Feature roadmap display

### Placeholder Pages
- Coming soon design
- Professional placeholder content

## 🤝 Contributing

This is a custom project for Paroki Tomang. For contributions or suggestions, please contact the project maintainer.

## 📄 License

Proprietary - Paroki Santa Maria Bunda Karmel Tomang

## 📞 Support

For technical support or questions:
- Email: admin@parokitomang.org (example)
- Website: https://parokitomang.org (example)

---

**Made with ❤️ for Paroki Santa Maria Bunda Karmel Tomang**

*Jl. Tomang Raya, Tomang, Grogol Petamburan, Jakarta Barat*
