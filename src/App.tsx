import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  ArrowRight, 
  MessageSquare, 
  ChevronLeft, 
  CreditCard, 
  Send, 
  Zap, 
  Menu, 
  User, 
  History, 
  MapPin, 
  LogOut, 
  Search, 
  ChevronDown,
  ShieldCheck,
  Star,
  Play,
  ShoppingBag,
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initializeApp } from 'firebase/app';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut
} from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, setDoc, where, getDocs } from 'firebase/firestore';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  handleFirestoreError, 
  OperationType,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  updatePassword
} from './lib/firebase';

// --- TYPES ---
type ProductVariant = {
  id: string;
  name: string;
  price: number;
};

type Review = {
  id: string;
  author: string;
  date: string;
  text: string;
  attributes?: string[];
  images?: string[];
  helpfulCount?: number;
  avatar?: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  subcategory?: string;
  description: string;
  rating?: number;
  reviewsCount?: number;
  isLastStock?: boolean;
  variations?: ProductVariant[];
  reviews?: Review[];
};

type CartItem = {
  id: string; // unique item id based on product + variant
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
};

type ViewState = 'store' | 'product' | 'checkout' | 'chat_payment' | 'warehouse' | 'about' | 'admin' | 'admin_chat' | 'tracking' | 'dashboard' | 'auth';

// --- UTILS ---
const formatPHP = (amount: number) => {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const generateTrackingNumber = () => {
  return `PCB-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
};

const DELIVERY_FEE = 150;

// --- MOCK DATA ---
const WAREHOUSE_IMAGES = [
  "https://s3-media0.fl.yelpcdn.com/bphoto/jd8oi8gdsr0bGSkzsnXNOA/1000s.jpg",
  "https://s3-media0.fl.yelpcdn.com/bphoto/KFOV94AlUWVA2vl0J993Yg/348s.jpg",
  "https://www.projectlupad.com/wp-content/uploads/2022/08/Makotek-Computers-Copyright-to-Project-LUPAD-11-1024x682.jpg",
  "https://www.pcworld.com/wp-content/uploads/2025/06/170529-taipei-7-100724095-orig-1.jpg?quality=50&strip=all",
  "https://lh3.googleusercontent.com/gps-cs-s/APNQkAF3nhQy1KQDSop-hLgZaF-tslLHv4G1yZjjjxUqaAPWqNqKlgHAbzKsUkwbdaDwG1MmrY2LneY1xF8xI9v1kk0uP5YB14R63-s0aKj3SxRbBdHgMMk71d6pRW898yQcN37LSjtBUA=s680-w680-h510-rw"
];

const PRODUCTS: Product[] = [
  {
    id: 'p6',
    name: 'Samsung T7 Portable SSD',
    price: 2990,
    category: 'SSD',
    subcategory: 'PORTABLE',
    rating: 5.0,
    reviewsCount: 10,
    isLastStock: true,
    description: 'Light, pocket-sized Portable SSD T7 delivers fast speeds with easy and reliable data storage for transferring large files. Transfer massive files within seconds with the incredible speed of USB 3.2 Gen 2. Shock-resistant aluminum casing provides rugged durability alongside its sleek, modern aesthetic. High performance for work and play.',
    image: 'https://i.imgur.com/6ApxjHs.jpg',
    variations: [
      { id: 'v1', name: '1 Terabyte', price: 2990 },
      { id: 'v2', name: '2 Terabyte', price: 3790 }
    ],
    reviews: [
      {
        id: 'r_t7_1',
        author: 'Jonathan P',
        date: '2026-04-28',
        text: 'ito ang jackpot thanks Ng marami po',
        images: ['https://img.lazcdn.com/g/ugc/abbc5083000d4ac79447abad47d44149_7c4d6ba43625481d8d29b7404bcb00b6.jpg_x700q80.jpg_.webp'],
        helpfulCount: 12
      },
      {
        id: 'r_t7_2',
        author: 'Sarah K',
        date: '2026-05-01',
        text: 'legit super!!',
        images: ['https://img.lazcdn.com/g/ugc/b7c468f2f8c9413ba0b03a25783d8bb2_2_1771408633.590912.jpg_x700q80.jpg_.webp'],
        helpfulCount: 8
      }
    ]
  },
  {
    id: 'p1',
    name: 'Viewpoint 34-Inch Frameless Monitor',
    price: 7250,
    category: 'Monitors',
    subcategory: 'FRAMELESS',
    rating: 4.8,
    reviewsCount: 5,
    description: 'Immersive 34-inch ultrawide display featuring an elegant frameless design. Perfect for multitasking, wide-screen gaming, and cinematic viewing. Equipped with advanced color accuracy technologies, this monitor ensures vibrant visuals and deep contrasts, making every scene pop. Ideal for both home office setups and intense gaming battlestations.',
    image: 'https://i.imgur.com/NXt9ICm.jpg',
    reviews: [
      {
        id: 'r1',
        author: 'Yngwie',
        date: '2025-07-21',
        text: 'solid medyo na delayed lang ng 3days pero maayos pakaging ng seller order na din kayo di kayo madidismaya sa item na darating',
        attributes: ['🔄Refresh Rate:fast'],
        helpfulCount: 2
      },
      {
        id: 'r2',
        author: 'R***a',
        date: '2026-03-08',
        attributes: ['Display Size: 34 inches'],
        text: 'Nice ganda, legit yung item at secure din yung package. balot na balot. Kaya lang 100 hz lang yung refresh rate sakin. sa GPU ko ata di kaya ang 165 hz.',
        images: [
          'https://img.lazcdn.com/g/ugc/273a08d0dfe9458d957079effc9ba84d_4_1772911969.390267.jpg_x700q80.jpg_.webp',
          'https://img.lazcdn.com/g/ugc/273a08d0dfe9458d957079effc9ba84d_3_1772911921.427305.jpg_x700q80.jpg_.webp'
        ],
        helpfulCount: 0
      },
      {
        id: 'r3',
        author: 'Joseph Novicio',
        date: '2026-01-13',
        attributes: ['Display Size: 34 inches'],
        text: 'ok naman sya..mabilis dumating.. un nga lang.. 100hz lang sya..pero 165hz ung nasa caption..pero overall.. ok naman..worth the price..',
        helpfulCount: 0
      },
      {
        id: 'r4',
        author: 'L***r',
        date: '2026-01-10',
        attributes: ['Display Size: 34 inches', '📺Resolution:10/10', '🔄Refresh Rate:goods', '📏Size:10/10'],
        text: 'maganda! at quality, pang office and gaming na din. highly recommended.',
        helpfulCount: 0
      },
      {
        id: 'r5',
        author: 'K***o',
        date: '2025-06-30',
        text: 'sinadya ko idelay ang review para matest ng matagal ang monitor, so far ao good, beyod satisfaction, quality tlga xa sa price nia, nilaro ko settings din ng monitor may may setting xa na sobra ganda ng color, sulit na sulit xa sa presyo may 34 inch ka na',
        images: [
          'https://img.lazcdn.com/g/ugc/c8cc466249434554ab300fbeb776b503_eb603f911f4d4a6d8fc540c5b46cb286.jpg_x700q80.jpg_.webp',
          'https://img.lazcdn.com/g/ugc/ef00ac0e9ea74159b2e84beaac7156c5_99b4355f5ed3460694ce32bc4bbdc6e7.jpg_x700q80.jpg_.webp'
        ],
        helpfulCount: 0
      }
    ]
  },
  {
    id: 'p2',
    name: 'NVIDIA GeForce GTX 1050 Ti',
    price: 6399,
    category: 'Gpu/Video Card',
    subcategory: '1050 TI',
    rating: 4.5,
    reviewsCount: 12,
    description: 'Reliable 1080p gaming performance. The GTX 1050 Ti delivers solid framerates for your favorite esports titles and modern games without breaking the bank. Featuring dual fan cooling, factory-overclocked speeds, and energy-efficient architecture, it offers one of the best performance-to-value ratios for budget PC builds.',
    image: 'https://i.imgur.com/FggxtZ6.jpg',
  },
  {
    id: 'p3',
    name: 'AMD Ryzen 7 Processor',
    price: 7250,
    category: 'PROCESSOR',
    subcategory: 'RYZEN 7',
    rating: 4.9,
    reviewsCount: 24,
    description: 'Experience incredible multi-core performance for gaming, streaming, and content creation. The Ryzen 7 handles heavy workloads with effortless ease. Engineered with precision 7nm architecture, it delivers exceptional boost clocks and thermal efficiency. Seamlessly edit videos or run complex applications while simultaneously streaming without a hitch.',
    image: 'https://i.imgur.com/7KoRmgZ.jpg',
  },
  {
    id: 'p4',
    name: 'Samsung 1TB NVMe M.2 SSD',
    price: 5500,
    category: 'SSD',
    subcategory: 'SAMSUNG',
    rating: 4.8,
    reviewsCount: 18,
    description: 'Blazing fast read and write speeds. Dramatically reduce boot times and game load screens with Samsung\'s legendary NVMe reliability. This 1TB capacity drive guarantees sequential performance that vastly outshines traditional SATA SSDs, transforming your entire operating system\'s responsiveness.',
    image: 'https://i.imgur.com/2btT2co.jpg',
  },
  {
    id: 'p5',
    name: 'Samsung 2TB NVMe M.2 SSD',
    price: 6500,
    category: 'SSD',
    subcategory: 'SAMSUNG',
    rating: 4.9,
    reviewsCount: 14,
    description: 'Massive 2TB storage capacity with blazing fast NVMe read/write speeds. Never run out of space for your massive game library or heavy video projects. With advanced thermal control and power efficiency, this drive maintains peak sustained performance even during the most demanding file transfers and rendering tasks.',
    image: 'https://i.imgur.com/2btT2co.jpg',
  },
  {
    id: 'p7',
    name: 'Portable SSD Rugged Storage',
    price: 1850,
    category: 'SSD',
    subcategory: 'PORTABLE',
    rating: 5.0,
    reviewsCount: 2,
    description: 'Compact, durable, and water-resistant external SSD designed for fast data transfer on the go. Features a rugged casing to keep your files perfectly secure wherever life takes you. Perfect for photographers, videographers, and professionals needing reliable storage in the field.',
    image: 'https://i.imgur.com/2nhMGVh.jpg',
    reviews: [
      {
        id: 'r6',
        author: 'Verified Buyer',
        date: '2026-04-10',
        text: 'The external SSD works good. Totally working to the boot. I like it very muchh . Totally recommended to another people who wants to buy it. The casing is also hard covered and water resistant so,the external hard disk is safe in it.',
        avatar: 'https://img.lazcdn.com/g/ot/roc/8854ba5ba5e8adc53f61e9c8073683e5.jpg_x700q80.jpg_.webp'
      },
      {
        id: 'r7',
        author: 'PC Bodega Customer',
        date: '2026-04-18',
        text: 'thank youu Pc Bodega ok po product arrived in bubble wrap and box bili po ako next time',
        avatar: 'https://img.lazcdn.com/g/ot/roc/525a7800b4483c306d6b2ec3943cbb85.jpg_x700q80.jpg_.webp'
      }
    ]
  }
];

// --- MAIN APP COMPONENT ---
export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [view, setView] = useState<ViewState>('store');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState({ name: '', email: '', phone: '', address: '' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currUser) => {
      setUser(currUser);
      if (currUser) {
        // Updated admin check to include the requested credentials pattern
        setIsAdmin(currUser.email === 'paoloesteban75@gmail.com' || currUser.email === 'akolangpo@pcbodega.com');
        
        // Fetch user profile from Firestore
        const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', currUser.uid)));
        if (!userDoc.empty) {
          setUserProfile(userDoc.docs[0].data());
          if (userDoc.docs[0].data().address && !checkoutData.address) {
            setCheckoutData(prev => ({ ...prev, address: userDoc.docs[0].data().address, phone: userDoc.docs[0].data().phone || '' }));
          }
        }
      } else {
        setIsAdmin(false);
        setUserProfile(null);
      }
    });

    const timer = setTimeout(() => setShowPopup(true), 2000);

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (isCartOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isCartOpen]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let currentUser = user;

    // Automatic registration if not logged in
    if (!currentUser) {
      try {
        // Use a generated password for auto-registration since we don't ask for one at checkout
        const autoPass = 'Customer123!'; 
        const result = await createUserWithEmailAndPassword(auth, checkoutData.email, autoPass);
        currentUser = result.user;
        await updateProfile(currentUser, { displayName: checkoutData.name });
        
        // Save profile
        await setDoc(doc(db, 'users', currentUser.uid), {
          displayName: checkoutData.name,
          email: checkoutData.email,
          address: checkoutData.address,
          phone: checkoutData.phone,
          updatedAt: serverTimestamp()
        });
      } catch (err: any) {
        // If user already exists, we continue with order as guest or ask them to login 
        // For "automatic" flow, we'll try to just proceed if possible or handle error
        console.error("Auto-registration error", err);
      }
    }

    const trackingNumber = generateTrackingNumber();
    const orderData = {
      ...checkoutData,
      userId: currentUser?.uid || null,
      trackingNumber,
      items: cart.map(item => ({
        id: item.id,
        name: item.product.name,
        variant: item.selectedVariant?.name || null,
        price: item.selectedVariant ? item.selectedVariant.price : item.product.price,
        quantity: item.quantity
      })),
      total: cartSubtotal + DELIVERY_FEE,
      status: 'pending',
      createdAt: serverTimestamp()
    };

    try {
      const path = 'orders';
      await addDoc(collection(db, path), orderData);
      
      if (currentUser) {
        const chatPath = `chats`;
        const chatId = currentUser.uid;
        await setDoc(doc(db, chatPath, chatId), {
          userId: currentUser.uid,
          userName: currentUser.displayName || checkoutData.name,
          lastMessage: `New Order: ${trackingNumber} (${formatPHP(cartSubtotal + DELIVERY_FEE)})`,
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Instant chat box appearance as requested
        setSelectedChatId(currentUser.uid);
        setView('admin_chat');
      }

      alert(`Order placed! Tracking ID: ${trackingNumber}. A support chat has been opened for you.`);
      setCart([]);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'orders');
    }
  };

  const addToCart = (product: Product, variant?: ProductVariant) => {
    const itemPrice = variant ? variant.price : product.price;
    const cartItemId = `${product.id}-${variant?.id || 'base'}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: cartItemId, product, quantity: 1, selectedVariant: variant }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.id === cartItemId) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter((item) => item.quantity > 0);
    });
  };

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => {
    const price = item.selectedVariant ? item.selectedVariant.price : item.product.price;
    return acc + price * item.quantity;
  }, 0);

  const startCheckout = () => {
    setIsCartOpen(false);
    setView('checkout');
  };

  const navigateToProduct = (product: Product) => {
    setSelectedProduct(product);
    setView('product');
  };

  const navigateTo = (newView: ViewState) => {
    setView(newView);
    setIsMobileMenuOpen(false);
  };

  const loginRedirect = () => {
    if (!user) setView('auth');
    else setView('dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-100 flex-1 w-full max-w-[100vw] overflow-x-hidden">
      {/* Top Banner */}
      <div className="bg-sky-600 min-h-10 flex items-center justify-center z-50 relative top-0 gap-2 px-4 shadow-[0_2px_10px_rgba(14,165,233,0.2)] py-2">
        <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-black italic text-center">
          Products being sold here has limited stocks. For wholesale purchase, <button onClick={() => navigateTo('warehouse')} className="underline hover:text-white inline-block">visit our Warehouse</button>
        </span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 h-16 px-4 sm:px-8 border-b border-white/10 flex items-center justify-between bg-bg-surface backdrop-blur-md bg-opacity-90">
        <div className="flex items-center gap-4">
          <button className="lg:hidden text-slate-300 hover:text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="w-6 h-6" />
          </button>
          
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => navigateTo('store')}
          >
            <div className="w-8 h-8 bg-sky-500 rounded-md flex items-center justify-center font-bold text-black italic text-lg transition-transform group-hover:scale-105">
              PB
            </div>
            <span className="text-xl font-bold tracking-tighter uppercase hidden sm:inline-block">PC Bodega</span>
          </div>
        </div>

        <nav className="hidden lg:flex gap-8 text-sm font-medium text-slate-400">
          <button onClick={() => navigateTo('store')} className={(view === 'store' || view === 'product') ? 'text-sky-400 font-bold' : 'hover:text-white transition-colors'}>Inventory</button>
          <button onClick={() => navigateTo('tracking')} className={view === 'tracking' ? 'text-sky-400 font-bold' : 'hover:text-white transition-colors'}>Track Order</button>
          <button onClick={() => navigateTo('warehouse')} className={view === 'warehouse' ? 'text-sky-400 font-bold' : 'hover:text-white transition-colors'}>Our Warehouse</button>
          <button onClick={() => navigateTo('about')} className={view === 'about' ? 'text-sky-400 font-bold' : 'hover:text-white transition-colors'}>About Us</button>
          {isAdmin && <button onClick={() => navigateTo('admin')} className={view === 'admin' ? 'text-orange-400 font-bold' : 'text-orange-500/70 hover:text-orange-400 transition-colors'}>Seller Dashboard</button>}
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={loginRedirect}>
            {user ? (
              <>
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=0ea5e9&color=fff`} alt="" className="w-8 h-8 rounded-full border border-white/10" />
                <span className="text-[10px] font-bold text-slate-400 hidden sm:inline-block group-hover:text-white uppercase tracking-wider">{isAdmin ? 'Seller Mode' : 'Dashboard'}</span>
              </>
            ) : (
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-slate-400 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-xl">
                 <User className="w-3.5 h-3.5" />
                 <span>Login / Register</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-slate-300 hover:text-white transition-colors hover:bg-white/5 rounded-full"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartItemsCount > 0 && (
              <span className="absolute 0-top-1 -right-1 bg-sky-500 text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Nav Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden bg-bg-surface border-b border-white/10 overflow-hidden absolute w-full z-30 top-[104px]"
          >
             <div className="p-4 flex flex-col gap-4 text-sm font-medium">
                {isAdmin && <button onClick={() => navigateTo('admin')} className="text-left py-2 text-orange-400 font-bold">Seller Dashboard</button>}
                <button onClick={() => navigateTo('store')} className="text-left py-2 hover:text-sky-400">Inventory</button>
                <button onClick={() => navigateTo('tracking')} className="text-left py-2 hover:text-sky-400">Track Order</button>
                <button onClick={() => navigateTo('warehouse')} className="text-left py-2 hover:text-sky-400">Our Warehouse</button>
                <button onClick={() => navigateTo('about')} className="text-left py-2 hover:text-sky-400">About Us</button>
                <button onClick={loginRedirect} className="text-left py-2 text-slate-400 border-t border-white/5 pt-4">{user ? 'My Dashboard' : 'Login / Register'}</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full h-full relative z-10">
        <AnimatePresence mode="wait">
          {view === 'store' && (
            <motion.div key="store" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
              <Storefront 
                products={PRODUCTS} 
                onProductClick={navigateToProduct}
                onAddToCart={addToCart} 
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
              />
            </motion.div>
          )}

          {view === 'product' && selectedProduct && (
            <motion.div key="product" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1">
              <ProductView 
                product={selectedProduct} 
                onAddToCart={addToCart} 
                onBack={() => setView('store')} 
              />
            </motion.div>
          )}

          {view === 'warehouse' && (
             <motion.div key="warehouse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
              <WarehouseView />
            </motion.div>
          )}

          {view === 'about' && (
             <motion.div key="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
              <AboutView onNavigate={navigateTo} />
            </motion.div>
          )}

          {view === 'checkout' && (
             <motion.div key="checkout" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="flex-1">
              <CheckoutView 
                cart={cart} 
                subtotal={cartSubtotal} 
                checkoutData={checkoutData}
                setCheckoutData={setCheckoutData}
                onProceed={handleCheckout} 
                onBack={() => setView('store')} 
              />
            </motion.div>
          )}

          {view === 'admin' && isAdmin && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1">
               <AdminDashboard onOpenChat={(chatId) => { setSelectedChatId(chatId); setView('admin_chat'); }} />
            </motion.div>
          )}

          {view === 'admin_chat' && isAdmin && selectedChatId && (
             <motion.div key="admin_chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1">
                <AdminChatView chatId={selectedChatId} onBack={() => setView('admin')} />
             </motion.div>
          )}

          {view === 'auth' && (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1">
               <AuthView onAuthSuccess={() => setView('dashboard')} />
            </motion.div>
          )}

          {view === 'dashboard' && user && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1">
               <UserDashboardView user={user} profile={userProfile} onSignOut={() => { setView('store'); }} onNavigate={setView} />
            </motion.div>
          )}

          {view === 'tracking' && (
            <motion.div key="tracking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1">
               <TrackingView />
            </motion.div>
          )}
        </AnimatePresence>

        <DeliveryPopup isOpen={showPopup} onClose={() => setShowPopup(false)} />

        {/* Floating Chat Button for Users */}
        {user && !isAdmin && (
          <button 
            onClick={() => {
              setSelectedChatId(user.uid);
              setView('admin_chat');
            }}
            className="fixed bottom-6 right-6 w-14 h-14 bg-sky-500 text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-40 group"
          >
             <MessageSquare className="w-6 h-6" />
             <span className="absolute right-full mr-4 bg-bg-surface border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Chat with Seller</span>
          </button>
        )}
      </main>

      {/* Footer */}
      {(view === 'store' || view === 'warehouse' || view === 'about' || view === 'product') && (
        <footer className="h-10 mt-auto bg-[#0A0B0D] px-4 sm:px-8 flex items-center justify-between text-[10px] text-slate-600 border-t border-white/5 uppercase tracking-widest relative z-10 w-full">
          <span>© 2026 PC Bodega Customs</span>
          <span className="hidden sm:inline-block text-sky-500/70">Verified Retailer • Manila, PH</span>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Warranty</span>
          </div>
        </footer>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-bg-surface border-l border-white/10 z-50 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-bold tracking-tight mb-1">Active Cart</h2>
                  <p className="text-slate-500 text-xs uppercase tracking-widest">Secure Checkout Session</p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                    <ShoppingCart className="w-16 h-16 opacity-20" />
                    <p className="font-medium">Your cart is empty.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-bg-card border border-white/5 rounded-xl">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-bg-image flex-shrink-0 border border-white/5">
                        <img 
                          src={item.product.image} 
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/200/200'; }}
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-sm font-medium leading-tight mb-0.5 line-clamp-1">{item.product.name}</h3>
                          {item.selectedVariant ? (
                             <p className="text-xs text-sky-400 font-medium mb-1">Variant: {item.selectedVariant.name}</p>
                          ) : (
                             <p className="text-[10px] text-slate-500 mb-1">{item.product.category}</p>
                          )}
                          <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="font-mono text-sky-400 font-bold tracking-tight">
                            {formatPHP((item.selectedVariant ? item.selectedVariant.price : item.product.price) * item.quantity)}
                          </p>
                          <div className="flex items-center gap-2 bg-black/40 rounded-lg px-1 py-1 border border-white/5">
                            <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-400 hover:text-white p-1 transition-colors"><Minus className="w-3 h-3" /></button>
                            <span className="text-xs font-mono w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-400 hover:text-white p-1 transition-colors"><Plus className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-white/10 bg-bg-surface">
                  <div className="flex justify-between items-center mb-6 pt-4">
                    <span className="font-bold">Total</span>
                    <span className="text-xl font-bold font-mono text-sky-400 tracking-tight">{formatPHP(cartSubtotal)}</span>
                  </div>
                  <button onClick={startCheckout} className="w-full bg-sky-500 hover:bg-sky-400 text-black font-extrabold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-tighter shadow-lg shadow-sky-500/20">
                    Proceed to Checkout <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- COMPONENTS ---

const CATEGORIES = [
  { group: 'Monitors', items: ['- IPS', '- FRAMELESS'] },
  { group: 'Gpu/Video Card', items: ['- 1050 TI', '- 750 Ti'] },
  { group: 'SSD', items: ['- SAMSUNG', '- PORTABLE'] },
  { group: 'PROCESSOR', items: ['- RYZEN 7', '- RYZEN 5'] },
];

function Storefront({ products, onProductClick, onAddToCart, activeCategory, setActiveCategory }: { 
  products: Product[], onProductClick: (p: Product) => void, onAddToCart: (p: Product) => void,
  activeCategory: string | null, setActiveCategory: (c: string | null) => void 
}) {
  
  const filteredProducts = activeCategory 
    ? products.filter(p => activeCategory.includes(p.subcategory || '') || activeCategory.includes(p.category))
    : products;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-8">
      {/* Website Banner */}
      <div className="w-full h-auto overflow-hidden rounded-2xl border border-white/10 relative shadow-xl">
         <img 
            src="https://i.imgur.com/v7LCEd5.jpg" 
            alt="PC Bodega Banner" 
            className="w-full h-[200px] md:h-[400px] object-cover object-center" 
         />
         <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-[#0A0B0D]/40 to-transparent opacity-90" />
         <div className="absolute bottom-6 left-6 md:left-8">
            <span className="bg-sky-500 text-black text-[10px] md:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded italic mb-2 inline-block">Wholesale Ready</span>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white mb-2 leading-tight">Lowest Prices <br className="md:hidden" /> <span className="text-sky-400 italic">Guaranteed</span></h2>
            <p className="text-slate-300 text-xs md:text-sm max-w-sm">Direct from warehouse pricing for retail customers.</p>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Mobile Category Dropdown */}
        <div className="lg:hidden w-full">
           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Categories</label>
           <select 
             className="w-full bg-bg-surface border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-sky-500 appearance-none font-medium"
             value={activeCategory || ''}
             onChange={(e) => setActiveCategory(e.target.value || null)}
           >
              <option value="">All Hardware Essentials</option>
              {CATEGORIES.map(cat => (
                <optgroup key={cat.group} label={cat.group}>
                  {cat.items.map(item => (
                    <option key={item} value={item.replace('- ', '')}>{item.replace('- ', '')}</option>
                  ))}
                </optgroup>
              ))}
           </select>
        </div>

        {/* Desktop Categories Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 mt-2">
          <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2 uppercase tracking-wider text-sky-400">Categories</h3>
          <ul className="space-y-4 text-sm font-medium">
            <li className="cursor-pointer" onClick={() => setActiveCategory(null)}>
              <div className={`transition-colors ${!activeCategory ? 'text-sky-400' : 'text-slate-300 hover:text-white'}`}>All Products</div>
            </li>
            {CATEGORIES.map(cat => (
              <li key={cat.group}>
                <div className="text-slate-200 uppercase tracking-wide cursor-pointer hover:text-sky-400" onClick={() => setActiveCategory(cat.group)}>{cat.group}</div>
                <ul className="ml-4 mt-2 space-y-2 border-l border-white/10 pl-3">
                  {cat.items.map(item => {
                    const subcat = item.replace('- ', '');
                    const isActive = activeCategory === subcat;
                    return (
                      <li 
                        key={item} 
                        className={`cursor-pointer transition-colors ${isActive ? 'text-sky-400 font-bold' : 'text-slate-500 hover:text-white'}`}
                        onClick={() => setActiveCategory(subcat)}
                      >
                        {item}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-4">
            <h2 className="text-2xl md:text-3xl font-light">
              {activeCategory ? <span className="font-bold text-white">{activeCategory}</span> : "Hardware"} <span className="text-sky-500 font-bold italic">{activeCategory ? "Products" : "Essentials"}</span>
            </h2>
            <span className="text-xs text-slate-500 uppercase tracking-widest hidden sm:inline-block">
              {filteredProducts.length} Items
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product, idx) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-bg-card border border-white/5 rounded-xl p-4 flex flex-col gap-4 group hover:border-white/20 hover:shadow-lg hover:shadow-sky-500/5 transition-all h-full cursor-pointer"
                onClick={() => onProductClick(product)}
              >
                <div className="w-full aspect-[4/3] bg-bg-image rounded-lg flex items-center justify-center relative overflow-hidden border border-white/5">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/400/300'; }}
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                  <div className="absolute top-2 right-2 bg-sky-500 text-black font-bold text-[10px] px-2 py-0.5 rounded italic">
                    RETAIL
                  </div>
                </div>
                
                <div className="flex flex-col flex-1">
                  <h3 className="font-medium text-[15px] mb-1 leading-tight group-hover:text-sky-400 transition-colors">{product.name}</h3>
                  {product.isLastStock && (
                    <div className="flex items-center gap-1.5 mb-2 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded w-fit">
                       <Zap className="w-3 h-3 text-red-500 fill-red-500" />
                       <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Last Stock Left</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 mb-2">
                      <div className="flex text-yellow-400 text-xs">
                          {product.rating ? ('★'.repeat(Math.round(product.rating)) + '☆'.repeat(5 - Math.round(product.rating))) : '★★★★★'}
                      </div>
                      <span className="text-[10px] text-slate-500">({product.reviewsCount || 0})</span>
                  </div>
                  <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed flex-1">
                    {product.description}
                  </p>
                  
                  <div className="flex justify-between items-center mt-auto pt-2 border-t border-white/5">
                    <span className="font-bold text-sky-400 font-mono tracking-tight text-lg">
                      {product.variations ? `From ${formatPHP(Math.min(...product.variations.map(v=>v.price)))}` : formatPHP(product.price)}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); if(!product.variations) onAddToCart(product); else onProductClick(product); }}
                      className="p-2 bg-white/5 hover:bg-sky-500 hover:text-black rounded-lg transition-colors group-hover:bg-white/10"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-white/10 rounded-2xl">
                 No products found for this category.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 1.2 Single Product View
function ProductView({ product, onAddToCart, onBack }: { product: Product, onAddToCart: (p: Product, v?: ProductVariant) => void, onBack: () => void }) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(product.variations?.[0]);

  const activePrice = selectedVariant ? selectedVariant.price : product.price;

  return (
     <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group text-sm">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Store
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
           <div className="w-full aspect-square bg-bg-image rounded-2xl border border-white/10 overflow-hidden shadow-2xl p-4 md:p-8 flex items-center justify-center">
              <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
           </div>
           
           <div className="flex flex-col">
               <div className="mb-2">
                 <span className="text-sky-500 text-xs font-bold uppercase tracking-widest">{product.category} {product.subcategory && `> ${product.subcategory}`}</span>
               </div>
               <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">{product.name}</h1>
               {product.isLastStock && (
                 <div className="flex items-center gap-2 mb-4 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg w-fit animate-pulse">
                    <Zap className="w-4 h-4 text-red-500 fill-red-500" />
                    <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Hurry! Last inventory items remaining</span>
                 </div>
               )}
               <div className="flex items-center gap-2 mb-6">
                   <div className="flex text-yellow-400 text-sm">
                       {product.rating ? ('★'.repeat(Math.round(product.rating)) + '☆'.repeat(5 - Math.round(product.rating))) : '★★★★★'}
                   </div>
                   <span className="text-sm text-sky-400 hover:text-sky-300 font-medium cursor-pointer transition-colors" onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}>
                     {product.reviewsCount || 0} reviews
                   </span>
               </div>
               <div className="text-3xl font-mono text-sky-400 font-bold tracking-tighter mb-6">{formatPHP(activePrice)}</div>
               
               <p className="text-slate-300 text-sm leading-relaxed mb-8 text-justify">{product.description}</p>
               
               {product.variations && product.variations.length > 0 && (
                 <div className="mb-8">
                    <h4 className="text-sm font-bold uppercase tracking-wider mb-3 text-slate-400">Select Variation</h4>
                    <div className="flex flex-wrap gap-3">
                       {product.variations.map(variant => (
                         <button 
                           key={variant.id}
                           onClick={() => setSelectedVariant(variant)}
                           className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all ${selectedVariant?.id === variant.id ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-white/10 text-slate-300 hover:border-white/30 hover:bg-white/5'}`}
                         >
                            {variant.name}
                         </button>
                       ))}
                    </div>
                 </div>
               )}

               <div className="mt-auto pt-8 border-t border-white/10">
                 <button 
                   onClick={() => onAddToCart(product, selectedVariant)}
                   className="w-full bg-sky-500 hover:bg-sky-400 text-black font-extrabold py-4 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wide shadow-lg shadow-sky-500/20"
                 >
                   <ShoppingCart className="w-5 h-5" /> Add to Cart
                 </button>
               </div>
           </div>
        </div>

        {/* Product Reviews Section */}
        <div id="reviews-section" className="mt-20 pt-10 border-t border-white/10">
           <h2 className="text-2xl font-bold uppercase tracking-tight mb-8">Customer <span className="text-sky-500 italic">Reviews</span></h2>
           {(!product.reviews || product.reviews.length === 0) ? (
             <div className="bg-bg-card border border-white/5 rounded-2xl p-10 text-center flex flex-col items-center justify-center">
                <MessageSquare className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">No reviews yet</h3>
                <p className="text-slate-500 text-sm max-w-md">Real customer feedback and verified purchase photos will be displayed here once submitted.</p>
             </div>
           ) : (
             <div className="space-y-6">
                {product.reviews.map(review => (
                  <div key={review.id} className="bg-bg-card border border-white/5 rounded-2xl p-6 shadow-md">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-slate-300 uppercase shrink-0 overflow-hidden">
                           {review.avatar ? (
                             <img src={review.avatar} alt={review.author} className="w-full h-full object-cover" />
                           ) : (
                             review.author.charAt(0)
                           )}
                        </div>
                        <div>
                           <h4 className="font-bold text-sm text-white">{review.author}</h4>
                           <p className="text-xs text-slate-500">{review.date}</p>
                        </div>
                     </div>
                     <div className="mb-3 flex flex-wrap gap-2">
                        <div className="text-yellow-400 text-sm font-medium tracking-widest leading-none">★★★★★</div>
                     </div>
                     <p className="text-slate-300 text-sm leading-relaxed mb-4">{review.text}</p>
                     
                     {review.attributes && review.attributes.length > 0 && (
                       <div className="flex flex-wrap gap-2 mb-4">
                          {review.attributes.map((attr, idx) => (
                             <span key={idx} className="bg-white/5 border border-white/10 text-slate-400 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded">
                                {attr}
                             </span>
                          ))}
                       </div>
                     )}

                     {review.images && review.images.length > 0 && (
                       <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                           {review.images.map((img, idx) => (
                              <img key={idx} src={img} alt={`Review photo ${idx + 1}`} className="h-24 w-auto rounded-lg object-cover border border-white/10 cursor-pointer hover:border-sky-500 transition-colors shrink-0" />
                           ))}
                       </div>
                     )}

                     <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                         <span className="text-xs text-slate-500 font-medium">Was this helpful?</span>
                         <button className={`text-xs font-bold px-3 py-1.5 rounded transition-all ${review.helpfulCount && review.helpfulCount > 0 ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'}`}>
                            Helpful ({review.helpfulCount || 0})
                         </button>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
     </div>
  );
}

// 1.5. Warehouse View Component
function WarehouseView() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold tracking-tight uppercase mb-4">Our <span className="text-sky-500 italic">Warehouse</span></h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Welcome to the heart of PC Bodega operations. We maintain direct stock of thousands of premium PC parts, managing massive inventory to ensure the components you need are available immediately for shipment or pickup.
        </p>
      </div>
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {WAREHOUSE_IMAGES.map((img, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1, duration: 0.5 }} className="break-inside-avoid relative group rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all shadow-lg">
            <img src={img} alt={`Warehouse facilities view ${idx + 1}`} className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-700" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// --- MODALS & DASHBOARD ---

function DeliveryPopup({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-[#111318] border border-sky-500/30 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(14,165,233,0.2)] max-w-lg w-full"
          >
            <div className="p-1">
               <div className="bg-sky-500 py-3 text-center">
                  <span className="text-black font-black text-sm uppercase tracking-[0.2em] italic">Ultimate Hardware Sale</span>
               </div>
            </div>
            
            <div className="p-8 md:p-12 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-sky-500/10 rounded-full flex items-center justify-center mb-6 border border-sky-500/20">
                  <span className="text-sky-400 font-black text-2xl animate-pulse">70%</span>
               </div>
               
               <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 uppercase">
                  BIG DEAL <br />
                  <span className="text-sky-500 italic">SAMSUNG T7</span>
               </h3>
               
               <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
                  Get the Samsung T7 Portable SSD at a massive <span className="text-sky-400 font-bold">70% OFF</span> today! Exclusive warehouse retail price for limited units only.
               </p>
               
               <button 
                  onClick={onClose}
                  className="w-full bg-white text-black font-black py-4 rounded-xl uppercase tracking-widest hover:bg-sky-400 transition-colors"
               >
                  Shop Now
               </button>
            </div>
            
            <button 
               onClick={onClose}
               className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
               <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function AdminDashboard({ onOpenChat }: { onOpenChat: (id: string) => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'messages'>('orders');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qChats = query(collection(db, 'chats'), orderBy('updatedAt', 'desc'));
    const unsubChats = onSnapshot(qChats, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => {
      unsubOrders();
      unsubChats();
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
             <h1 className="text-4xl font-bold tracking-tight uppercase mb-2">Seller <span className="text-orange-500 italic">Dashboard</span></h1>
             <p className="text-slate-500 text-sm">Managing retail inventory and customer requests from Firestore.</p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
             <button 
               onClick={() => setActiveTab('orders')}
               className={`px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${activeTab === 'orders' ? 'bg-sky-500 text-black' : 'text-slate-400 hover:text-white'}`}
             >
                Orders
             </button>
             <button 
               onClick={() => setActiveTab('messages')}
               className={`px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${activeTab === 'messages' ? 'bg-orange-500 text-black' : 'text-slate-400 hover:text-white'}`}
             >
                Messages {chats.length > 0 && <span className="ml-2 bg-black/20 px-1.5 rounded-full">{chats.length}</span>}
             </button>
          </div>
       </div>

       <div className="grid grid-cols-1 gap-6">
          {loading ? (
             <div className="text-center py-20 text-slate-500 italic">Connecting to secure database...</div>
          ) : activeTab === 'orders' ? (
             orders.length === 0 ? (
                <div className="text-center py-20 bg-bg-card border border-white/5 rounded-3xl">
                   <p className="text-slate-500 font-medium">No orders recorded in the cloud yet.</p>
                </div>
             ) : (
                orders.map((order) => (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-bg-card border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors shadow-xl"
                  >
                     <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between gap-4">
                        <div>
                           <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold">{order.name}</h3>
                              <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded font-bold uppercase tracking-tighter border border-orange-500/20">{order.status}</span>
                           </div>
                           <div className="flex flex-col gap-1 text-xs text-slate-400">
                              <span className="flex items-center gap-2 lowercase text-sky-400"><span className="uppercase text-slate-600 font-bold">Email:</span> {order.email}</span>
                              <span className="flex items-center gap-2"><span className="uppercase text-slate-600 font-bold">Phone:</span> {order.phone}</span>
                              <span className="flex items-center gap-2"><span className="uppercase text-slate-600 font-bold">Address:</span> {order.address}</span>
                           </div>
                        </div>
                        <div className="text-right flex flex-col justify-between items-end">
                           <span className="text-xs text-slate-600 font-mono italic">#{order.id.slice(-6).toUpperCase()}</span>
                           <div className="text-2xl font-mono font-bold text-sky-400">{formatPHP(order.total)}</div>
                        </div>
                     </div>
                     <div className="p-6 bg-black/20">
                        <div className="text-[10px] text-slate-600 uppercase font-bold tracking-widest mb-4">Line Items</div>
                        <div className="space-y-3">
                           {order.items?.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-[10px] font-bold text-slate-500">{item.quantity}x</div>
                                    <span className="text-slate-300">{item.name} {item.variant && <span className="text-sky-500/70 text-xs ml-1">({item.variant})</span>}</span>
                                 </div>
                                 <span className="font-mono text-slate-500">{formatPHP(item.price * item.quantity)}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                     <div className="px-6 py-4 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[10px] text-slate-700 italic">Ordered on {order.createdAt?.toDate?.()?.toLocaleString() || 'Process pending...'}</span>
                        <div className="flex gap-4">
                           {order.email && (
                              <button onClick={() => {
                                 const c = chats.find(ch => ch.id === order.userId || ch.userName === order.name);
                                 if (c) onOpenChat(c.id);
                              }} className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                                 Message User <MessageSquare className="w-3 h-3" />
                              </button>
                           )}
                           <button className="text-xs font-bold text-sky-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                              Update Status <ArrowRight className="w-3 h-3" />
                           </button>
                        </div>
                     </div>
                  </motion.div>
                ))
             )
          ) : (
             chats.length === 0 ? (
                <div className="text-center py-20 bg-bg-card border border-white/5 rounded-3xl">
                   <p className="text-slate-500 font-medium">No customer inquiries yet.</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {chats.map(chat => (
                      <div key={chat.id} onClick={() => onOpenChat(chat.id)} className="bg-bg-card border border-white/5 p-6 rounded-2xl cursor-pointer hover:border-orange-500/50 transition-all group shadow-lg">
                         <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-slate-300">
                                  {chat.userName?.charAt(0) || 'C'}
                               </div>
                               <div>
                                  <h4 className="font-bold text-sm tracking-tight group-hover:text-orange-400 transition-colors">{chat.userName}</h4>
                                  <p className="text-[10px] text-slate-500 font-mono tracking-tighter italic">ID: {chat.id}</p>
                               </div>
                            </div>
                            <span className="text-[10px] text-slate-600 font-mono italic">{chat.updatedAt?.toDate?.()?.toLocaleTimeString()}</span>
                         </div>
                         <p className="text-xs text-slate-400 line-clamp-1 italic mb-4">"{chat.lastMessage}"</p>
                         <button className="w-full py-2 bg-white/5 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] group-hover:bg-orange-500 transition-all group-hover:text-black">Open Conversation</button>
                      </div>
                   ))}
                </div>
             )
          )}
       </div>
    </div>
  );
}
function AdminChatView({ chatId, onBack }: { chatId: string, onBack: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, [chatId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !auth.currentUser) return;

    const text = inputText;
    setInputText('');

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text,
        senderId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      
      await setDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-120px)]">
       <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm"><ChevronLeft className="w-4 h-4" /> Back to Dashboard</button>
       <div className="flex-1 bg-bg-card border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
          <div className="p-4 bg-black/40 border-b border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center font-bold text-sky-400">?</div>
                <span className="font-bold text-sm">Customer Support Chat</span>
             </div>
             <span className="text-[10px] text-slate-500 uppercase font-bold px-2 py-1 bg-white/5 rounded">Live Thread</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
             {messages.map((m) => (
               <div key={m.id} className={`flex ${m.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${m.senderId === auth.currentUser?.uid ? 'bg-sky-500 text-black font-medium' : 'bg-white/5 text-slate-300 border border-white/5'}`}>
                     {m.text}
                  </div>
               </div>
             ))}
             <div ref={scrollRef} />
          </div>
          <form onSubmit={sendMessage} className="p-4 bg-black/40 border-t border-white/5 flex gap-2">
             <input 
               type="text" 
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               placeholder="Type a message to customer..." 
               className="flex-1 bg-bg-surface border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-sky-500"
             />
             <button type="submit" className="p-3 bg-sky-500 text-black rounded-xl hover:bg-sky-400 transition-colors">
                <Send className="w-5 h-5" />
             </button>
          </form>
       </div>
    </div>
  );
}

// --- NEW COMPONENTS ---

function AuthView({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let loginEmail = email;
    // Handle admin username mapping
    if (email.toLowerCase() === 'akolangpo') {
      loginEmail = 'akolangpo@pcbodega.com';
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, loginEmail, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        // Removed email verification requirement as requested
        
        // Initial profile creation
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          displayName: name,
          email: email,
          address: '',
          phone: '',
          updatedAt: serverTimestamp()
        });
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 flex flex-col items-center">
       <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center mb-8 italic font-black text-black text-2xl shadow-xl shadow-sky-500/20">PB</div>
       <h2 className="text-3xl font-bold tracking-tighter uppercase mb-2">{isLogin ? 'Welcome Back' : 'Join PC Bodega'}</h2>
       <p className="text-slate-500 text-sm mb-8 text-center">Manage your hardware orders and track delivery in real-time.</p>
       
       <form onSubmit={handleSubmit} className="w-full space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Full Name</label>
               <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-bg-card border border-white/5 rounded-xl px-4 py-3.5 focus:border-sky-500 outline-none transition-all" placeholder="John Doe" />
            </div>
          )}
          <div className="space-y-1.5">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Email Address</label>
             <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-bg-card border border-white/5 rounded-xl px-4 py-3.5 focus:border-sky-500 outline-none transition-all" placeholder="name@example.com" />
          </div>
          <div className="space-y-1.5">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Password</label>
             <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-bg-card border border-white/5 rounded-xl px-4 py-3.5 focus:border-sky-500 outline-none transition-all" placeholder="••••••••" />
          </div>

          {error && <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">{error}</p>}

          <button disabled={loading} type="submit" className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-black font-black py-4 rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20">
             {loading ? 'Processing...' : (isLogin ? 'Login to Account' : 'Create Account')}
          </button>
       </form>

       <button onClick={() => setIsLogin(!isLogin)} className="mt-8 text-xs text-slate-500 hover:text-sky-400 transition-colors uppercase tracking-[0.15em] font-bold">
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
       </button>
       
       <div className="w-full my-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-white/5"></div>
          <span className="text-[10px] text-slate-600 font-bold uppercase">Or Continue with</span>
          <div className="flex-1 h-px bg-white/5"></div>
       </div>

       <button onClick={signInWithGoogle} className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all">
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
          <span className="text-sm">Google Account</span>
       </button>
    </div>
  );
}

function UserDashboardView({ user, profile, onSignOut, onNavigate }: { user: FirebaseUser, profile: any, onSignOut: () => void, onNavigate: (v: ViewState) => void }) {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'chat'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user.uid]);

  const handleSignOut = async () => {
    await signOut(auth);
    onSignOut();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
       <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
             <div className="bg-bg-card border border-white/5 rounded-3xl p-6 mb-8 text-center">
                <div className="w-20 h-20 mx-auto rounded-full border-4 border-sky-500/20 p-1 mb-4">
                   <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=0ea5e9&color=fff`} className="w-full h-full rounded-full object-cover" />
                </div>
                <h3 className="font-bold text-lg leading-tight mb-1">{profile?.displayName || user.displayName || 'Hardware Enthusiast'}</h3>
                <p className="text-[10px] text-sky-500 font-bold uppercase tracking-widest">{user.emailVerified ? 'Verified Account' : 'Unverified Email'}</p>
                {!user.emailVerified && (
                  <button onClick={() => sendEmailVerification(user)} className="mt-2 text-[10px] text-slate-500 hover:text-sky-400">Resend Verification</button>
                )}
             </div>

             <div className="bg-bg-card border border-white/5 rounded-3xl overflow-hidden p-2 space-y-1">
                <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all ${activeTab === 'orders' ? 'bg-sky-500 text-black' : 'hover:bg-white/5 text-slate-400'}`}>
                   <History className="w-4 h-4" /> My Orders
                </button>
                <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all ${activeTab === 'profile' ? 'bg-sky-500 text-black' : 'hover:bg-white/5 text-slate-400'}`}>
                   <User className="w-4 h-4" /> My Profile
                </button>
                <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all ${activeTab === 'chat' ? 'bg-sky-500 text-black' : 'hover:bg-white/5 text-slate-400'}`}>
                   <MessageSquare className="w-4 h-4" /> Live Support
                </button>
                <button onClick={() => onNavigate('tracking')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all hover:bg-white/5 text-slate-400`}>
                   <Search className="w-4 h-4" /> Track Order
                </button>
                <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all border-t border-white/5 mt-4">
                   <LogOut className="w-4 h-4" /> Sign Out
                </button>
             </div>
          </div>

          {/* Main View */}
          <div className="lg:col-span-3">
             {activeTab === 'orders' && (
                <div className="space-y-6">
                   <h2 className="text-2xl font-bold tracking-tighter uppercase mb-6 flex items-center gap-3">
                      <History className="text-sky-500" /> Order <span className="text-sky-500 italic">History</span>
                   </h2>
                   {loading ? (
                      <div className="text-center py-20 text-slate-500 italic">Loading your orders...</div>
                   ) : orders.length === 0 ? (
                      <div className="bg-bg-card border border-white/5 rounded-3xl p-12 text-center text-slate-500">
                         <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-10" />
                         <p>You haven't placed any orders yet.</p>
                      </div>
                   ) : (
                      <div className="space-y-4">
                        {orders.map(order => (
                           <div key={order.id} className="bg-bg-card border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors">
                              <div className="p-6 flex flex-col md:flex-row justify-between gap-4">
                                 <div>
                                    <div className="flex items-center gap-3 mb-2">
                                       <span className="text-xs font-mono font-bold text-slate-500">#{order.trackingNumber || 'PENDING'}</span>
                                       <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded font-bold uppercase">{order.status}</span>
                                    </div>
                                    <p className="text-xs text-slate-400">Total: {formatPHP(order.total)} • Placed on {order.createdAt?.toDate?.()?.toLocaleDateString()}</p>
                                 </div>
                                 <button onClick={() => { setActiveTab('chat') }} className="text-xs font-bold text-sky-400 hover:text-white uppercase tracking-widest py-2 px-4 border border-sky-400/20 rounded-lg hover:border-sky-400 transition-all flex items-center gap-2">
                                    Track Delivery <MapPin className="w-3.5 h-3.5" />
                                 </button>
                              </div>
                           </div>
                        ))}
                      </div>
                   )}
                </div>
             )}

             {activeTab === 'profile' && (
                <div className="space-y-8">
                   <h2 className="text-2xl font-bold tracking-tighter uppercase mb-6 flex items-center gap-3">
                      <User className="text-sky-500" /> User <span className="text-sky-500 italic">Settings</span>
                   </h2>
                   <ProfileChangeForm user={user} profile={profile} />
                </div>
             )}

             {activeTab === 'chat' && (
                <div className="h-[600px] flex flex-col bg-bg-card border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                   <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                         <span className="text-sm font-bold uppercase tracking-widest text-slate-300">Live Support Thread</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono italic">Connected to PC Bodega Admin</span>
                   </div>
                   <div className="flex-1 overflow-hidden p-0">
                      <AdminChatView chatId={user.uid} onBack={() => {}} />
                   </div>
                </div>
             )}
          </div>
       </div>
    </div>
  );
}

function ProfileChangeForm({ user, profile }: { user: FirebaseUser, profile: any }) {
  const [name, setName] = useState(profile?.displayName || user.displayName || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (name !== user.displayName) {
        await updateProfile(user, { displayName: name });
      }
      if (password) {
        await updatePassword(user, password);
      }
      
      await setDoc(doc(db, 'users', user.uid), {
        displayName: name,
        address,
        phone,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      alert("Settings saved successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="bg-bg-card border border-white/5 rounded-3xl p-8 space-y-6 max-w-2xl">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
             <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-bg-surface border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-sky-500 text-sm" />
          </div>
          <div className="space-y-1.5">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phone Number</label>
             <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-bg-surface border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-sky-500 text-sm" />
          </div>
       </div>
       <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Delivery Address</label>
          <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-bg-surface border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-sky-500 text-sm resize-none" />
       </div>
       <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">New Password (Leave blank to keep current)</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-bg-surface border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-sky-500 text-sm" placeholder="••••••••" />
       </div>
       <button disabled={loading} type="submit" className="bg-sky-500 hover:bg-sky-400 text-black font-black py-4 px-12 rounded-xl uppercase tracking-widest transition-all">
          {loading ? 'Saving...' : 'Save Settings'}
       </button>
    </form>
  );
}

function TrackingView() {
  const [tn, setTn] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tn.trim()) return;
    setLoading(true);
    
    // As per user request: "any number generated... status must be will be delivered the next day during office hours"
    setTimeout(() => {
      setResult({
        status: 'Processing (On the way)',
        text: 'Your order will be delivered the next day during office hours.',
        number: tn.toUpperCase()
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center">
       <h1 className="text-4xl font-black uppercase tracking-tight mb-4 text-center">Track Your <span className="text-sky-500 italic">Package</span></h1>
       <p className="text-slate-500 mb-12 text-center max-w-lg">Enter your PC Bodega tracking number to check real-time delivery status and rider location.</p>
       
       <form onSubmit={handleSearch} className="w-full max-w-xl flex gap-3 mb-12">
          <input 
            type="text" 
            value={tn} 
            onChange={(e) => setTn(e.target.value)}
            placeholder="PCB-XXXX-XXXX" 
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg font-mono outline-none focus:border-sky-500 transition-all text-sky-400 placeholder:text-slate-700"
          />
          <button type="submit" className="bg-sky-500 hover:bg-sky-400 text-black px-8 rounded-2xl transition-all">
             <Search className="w-6 h-6" />
          </button>
       </form>

       {loading && <div className="animate-pulse text-sky-500 font-bold uppercase tracking-widest">Searching our cloud database...</div>}

       {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-bg-card border border-white/5 rounded-3xl p-8 mb-12 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <Truck className="w-32 h-32" />
             </div>
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                   <Zap className="w-5 h-5 text-green-500" />
                </div>
                <div>
                   <h3 className="text-xl font-bold tracking-tighter uppercase">{result.status}</h3>
                   <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Tracking: {result.number}</p>
                </div>
             </div>
             <p className="text-lg text-slate-300 leading-relaxed font-medium mb-4 italic">"{result.text}"</p>
             <div className="flex gap-2">
                <span className="text-[10px] bg-sky-500/10 text-sky-400 py-1 px-3 rounded-full font-bold uppercase tracking-widest">Same Day Dispatch</span>
                <span className="text-[10px] bg-white/5 text-slate-500 py-1 px-3 rounded-full font-bold uppercase tracking-widest">Metro Manila Priority</span>
             </div>
          </motion.div>
       )}

       <div className="w-full rounded-3xl overflow-hidden border border-white/10 bg-black/40 h-[400px] shadow-2xl">
          {/* User provided link: https://maps.app.goo.gl/Cncx8rtiiKQYqVDe7 */}
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.1278153434676!2d121.0425268!3d14.5912836!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c83f124c9c7f%3A0xe54e6015dd394d1f!2sCyberzone%20SM%20Megamall!5e0!3m2!1sen!2sph!4v1714652000000!5m2!1sen!2sph"
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
          />
       </div>
       <p className="mt-4 text-[10px] text-slate-600 uppercase font-black tracking-widest">Live Rider Tracking Enabled • SM Megamall Central Hub</p>
    </div>
  );
}

function AboutView({ onNavigate }: { onNavigate: (view: ViewState) => void }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 text-center">
      <h2 className="text-4xl font-bold tracking-tight uppercase mb-4">About <span className="text-sky-500 italic">PC Bodega</span></h2>
      <div className="bg-bg-card border border-white/10 rounded-2xl p-8 sm:p-12 shadow-2xl mt-12 text-justify">
          <p className="text-slate-300 leading-relaxed text-base sm:text-lg mb-6">
            We Started operations on August 1998 in a limited area along E. Rodriguez Avenue...
          </p>
          <button onClick={() => onNavigate('store')} className="mt-8 bg-sky-500 hover:bg-sky-400 text-black font-extrabold py-3.5 px-10 rounded-lg">Shop Deals</button>
      </div>
    </div>
  );
}

// 2. Checkout View Component
function CheckoutView({ cart, subtotal, checkoutData, setCheckoutData, onProceed, onBack }: any) {
  const tax = subtotal * 0.08;
  const total = subtotal + DELIVERY_FEE;

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-24">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <button onClick={onBack} className="text-sky-400 font-medium hover:text-sky-300">Return to Storefront</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 text-sm"><ChevronLeft className="w-4 h-4" /> Back to Shopping</button>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-7 space-y-10">
          <section>
            <h2 className="text-xl font-bold uppercase mb-6 pb-4 border-b border-white/10">Review Order</h2>
            <div className="space-y-3">
              {cart.map((item: CartItem) => (
                <div key={item.id} className="flex gap-4 items-center bg-bg-card p-4 rounded-xl border border-white/5">
                   <img src={item.product.image} className="w-16 h-16 rounded-lg object-cover border border-white/5" />
                   <div className="flex-1">
                      <h4 className="font-medium text-sm leading-tight">{item.product.name}</h4>
                      {item.selectedVariant && <p className="text-[10px] text-sky-400 mt-0.5">{item.selectedVariant.name}</p>}
                      <p className="text-slate-500 text-xs mt-1">Qty: {item.quantity}</p>
                   </div>
                   <div className="font-mono font-bold text-[15px] text-sky-400 tracking-tight">
                      {formatPHP((item.selectedVariant ? item.selectedVariant.price : item.product.price) * item.quantity)}
                   </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase mb-6 pb-4 border-b border-white/10">Delivery Details</h2>
            <form id="checkout-form" onSubmit={onProceed} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Complete Name</label>
                <input required type="text" className="w-full bg-bg-surface border border-white/10 text-sm rounded-lg px-4 py-3 outline-none focus:border-sky-500" value={checkoutData.name} onChange={(e) => setCheckoutData({...checkoutData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase">Email Address</label>
                  <input required type="email" className="w-full bg-bg-surface border border-white/10 text-sm rounded-lg px-4 py-3 outline-none focus:border-sky-500" value={checkoutData.email} onChange={(e) => setCheckoutData({...checkoutData, email: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase">Mobile Number</label>
                  <input required type="tel" className="w-full bg-bg-surface border border-white/10 text-sm rounded-lg px-4 py-3 outline-none focus:border-sky-500" value={checkoutData.phone} onChange={(e) => setCheckoutData({...checkoutData, phone: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Complete Delivery Address</label>
                <textarea required rows={3} className="w-full bg-bg-surface border border-white/10 text-sm rounded-lg px-4 py-3 outline-none focus:border-sky-500 resize-none" placeholder="Unit/House No., Street, Barangay, City, Province, Zip Code" value={checkoutData.address} onChange={(e) => setCheckoutData({...checkoutData, address: e.target.value})} />
              </div>
            </form>
          </section>
        </div>

        <div className="lg:col-span-5">
           <div className="bg-bg-surface border border-white/10 rounded-2xl p-8 sticky top-24 shadow-2xl">
              <h3 className="text-lg font-bold uppercase mb-6 flex items-center gap-2 tracking-wider">Order Summary</h3>
              <div className="space-y-3 mb-6 text-sm text-slate-300">
                 <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Subtotal Inventory</span><span className="font-mono text-white">{formatPHP(subtotal)}</span></div>
                 <div className="flex justify-between border-t border-white/5 pt-3"><span className="text-slate-500 italic">Delivery Fee (Flat Rate)</span><span className="font-mono text-slate-400">{formatPHP(DELIVERY_FEE)}</span></div>
              </div>
              <div className="border-t border-white/10 pt-5 mb-8 flex justify-between items-end">
                 <span className="text-base font-medium text-slate-400 uppercase">Grand Total</span>
                 <span className="text-3xl font-mono font-bold text-sky-400">{formatPHP(total)}</span>
              </div>
              <button type="submit" form="checkout-form" className="w-full bg-sky-500 hover:bg-sky-400 text-black font-extrabold py-4 rounded-lg uppercase tracking-tighter flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20">Proceed to Payment <ArrowRight className="w-5 h-5 ml-1" /></button>
           </div>
        </div>
      </div>
    </div>
  );
}
