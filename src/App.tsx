import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, X, Plus, Minus, ArrowRight, MessageSquare, ChevronLeft, CreditCard, Send, Zap, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  variations?: ProductVariant[];
  reviews?: Review[];
};

type CartItem = {
  id: string; // unique item id based on product + variant
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
};

type ViewState = 'store' | 'product' | 'checkout' | 'chat_payment' | 'warehouse' | 'about';

// --- UTILS ---
const formatPHP = (amount: number) => {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

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
    id: 'p6',
    name: 'Samsung T7 Portable SSD',
    price: 6499,
    category: 'SSD',
    subcategory: 'PORTABLE',
    rating: 4.7,
    reviewsCount: 8,
    description: 'Light, pocket-sized Portable SSD T7 delivers fast speeds with easy and reliable data storage for transferring large files. Transfer massive files within seconds with the incredible speed of USB 3.2 Gen 2. Shock-resistant aluminum casing provides rugged durability alongside its sleek, modern aesthetic.',
    image: 'https://i.imgur.com/6ApxjHs.jpg',
    variations: [
      { id: 'v1', name: '1 Terabyte', price: 6499 },
      { id: 'v2', name: '2 Terabyte', price: 7499 }
    ]
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

  useEffect(() => {
    if (isCartOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isCartOpen]);

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
          <button onClick={() => navigateTo('warehouse')} className={view === 'warehouse' ? 'text-sky-400 font-bold' : 'hover:text-white transition-colors'}>Our Warehouse</button>
          <button onClick={() => navigateTo('about')} className={view === 'about' ? 'text-sky-400 font-bold' : 'hover:text-white transition-colors'}>About Us</button>
        </nav>

        <div className="flex items-center gap-4">
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
                <button onClick={() => navigateTo('store')} className="text-left py-2 hover:text-sky-400">Inventory</button>
                <button onClick={() => navigateTo('warehouse')} className="text-left py-2 hover:text-sky-400">Our Warehouse</button>
                <button onClick={() => navigateTo('about')} className="text-left py-2 hover:text-sky-400">About Us</button>
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
                onProceed={(e) => { 
                   e.preventDefault(); 
                   window.open('https://tawk.to/pcbodega', '_blank', 'noopener,noreferrer');
                   setCart([]);
                   setView('store');
                }} 
                onBack={() => setView('store')} 
              />
            </motion.div>
          )}
        </AnimatePresence>
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

// 1.6 About Us View Component
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
  const total = subtotal + tax;

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
                 <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span className="font-mono text-white">{formatPHP(subtotal)}</span></div>
                 <div className="flex justify-between"><span className="text-slate-400">Estimated Tax</span><span className="font-mono text-white">{formatPHP(tax)}</span></div>
              </div>
              <div className="border-t border-white/10 pt-5 mb-8 flex justify-between items-end">
                 <span className="text-base font-medium text-slate-400 uppercase">Total</span>
                 <span className="text-3xl font-mono font-bold text-sky-400">{formatPHP(total)}</span>
              </div>
              <button type="submit" form="checkout-form" className="w-full bg-sky-500 hover:bg-sky-400 text-black font-extrabold py-4 rounded-lg uppercase tracking-tighter flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20">Proceed to Payment <ArrowRight className="w-5 h-5 ml-1" /></button>
           </div>
        </div>
      </div>
    </div>
  );
}
