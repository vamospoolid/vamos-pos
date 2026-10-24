// Curated high quality food & beverage image photography for Vamos Cafe & Billiard
// Optimized for quick loading on mobile staff devices with graceful fallback

export interface ProductVisual {
    imageUrl: string;
    emoji: string;
    categoryLabel: string;
    gradient: string;
    badgeBg: string;
    border: string;
}

export const getProductVisual = (name: string = '', category: string = '', customImageUrl?: string | null): ProductVisual => {
    const lowerName = name.toLowerCase();
    const lowerCat = (category || '').toLowerCase();

    // 1. If product has custom uploaded imageUrl, use it
    if (customImageUrl && customImageUrl.trim().length > 0) {
        return {
            imageUrl: customImageUrl,
            emoji: '🍽️',
            categoryLabel: category || 'Menu',
            gradient: 'from-amber-50 to-orange-50',
            badgeBg: 'bg-amber-100 text-amber-900',
            border: 'border-amber-200'
        };
    }

    // ── MINUMAN KOPI & SPECIALTY ──
    if (lowerName.includes('gula aren') || lowerName.includes('kopi susu')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80',
            emoji: '☕',
            categoryLabel: 'Kopi Susu',
            gradient: 'from-[#fef3c7] to-[#fde68a]',
            badgeBg: 'bg-[#78350f]/10 text-[#78350f] border-[#78350f]/20',
            border: 'border-amber-200'
        };
    }

    if (lowerName.includes('caramel') || lowerName.includes('macchiato')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=400&q=80',
            emoji: '🍮',
            categoryLabel: 'Macchiato',
            gradient: 'from-[#fffbeb] to-[#fef3c7]',
            badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
            border: 'border-amber-200'
        };
    }

    if (lowerName.includes('americano') || lowerName.includes('espresso') || lowerName.includes('black coffee')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
            emoji: '☕',
            categoryLabel: 'Americano',
            gradient: 'from-stone-100 to-stone-200',
            badgeBg: 'bg-stone-200 text-stone-800 border-stone-300',
            border: 'border-stone-300'
        };
    }

    if (lowerName.includes('coklat') || lowerName.includes('chocolate') || lowerName.includes('milo')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=400&q=80',
            emoji: '🍫',
            categoryLabel: 'Cokelat',
            gradient: 'from-[#fdf2e9] to-[#fae5d3]',
            badgeBg: 'bg-[#935116]/10 text-[#935116] border-[#935116]/20',
            border: 'border-orange-200'
        };
    }

    // ── TEH & MINUMAN SEGAR ──
    if (lowerName.includes('lemon tea')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80',
            emoji: '🍋',
            categoryLabel: 'Lemon Tea',
            gradient: 'from-yellow-50 to-amber-100',
            badgeBg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            border: 'border-yellow-200'
        };
    }

    if (lowerName.includes('lychee') || lowerName.includes('leci')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=400&q=80',
            emoji: '🍹',
            categoryLabel: 'Lychee Tea',
            gradient: 'from-rose-50 to-pink-100',
            badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
            border: 'border-rose-200'
        };
    }

    if (lowerName.includes('tea') || lowerName.includes('teh') || lowerName.includes('matcha')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
            emoji: '🍵',
            categoryLabel: 'Tea Series',
            gradient: 'from-emerald-50 to-teal-100',
            badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            border: 'border-emerald-200'
        };
    }

    if (lowerName.includes('mineral') || lowerName.includes('air') || lowerName.includes('aqua')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&w=400&q=80',
            emoji: '💧',
            categoryLabel: 'Air Mineral',
            gradient: 'from-sky-50 to-blue-100',
            badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
            border: 'border-sky-200'
        };
    }

    if (lowerName.includes('cola') || lowerName.includes('sprite') || lowerName.includes('fanta') || lowerName.includes('redbull') || lowerName.includes('kratingdaeng')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
            emoji: '🥤',
            categoryLabel: 'Soft Drink',
            gradient: 'from-red-50 to-rose-100',
            badgeBg: 'bg-red-100 text-red-800 border-red-200',
            border: 'border-red-200'
        };
    }

    // ── MAKANAN BERAT (RICE BOWL, NASI GORENG, MIE) ──
    if (lowerName.includes('nasi goreng')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=80',
            emoji: '🍳',
            categoryLabel: 'Nasi Goreng',
            gradient: 'from-orange-50 to-amber-100',
            badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
            border: 'border-orange-200'
        };
    }

    if (lowerName.includes('indomie') || lowerName.includes('mie goreng') || lowerName.includes('mie kuah') || lowerName.includes('noodles')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
            emoji: '🍜',
            categoryLabel: 'Indomie & Mie',
            gradient: 'from-amber-50 to-yellow-100',
            badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
            border: 'border-amber-200'
        };
    }

    if (lowerName.includes('beef') || lowerName.includes('teriyaki')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
            emoji: '🥩',
            categoryLabel: 'Rice Bowl Beef',
            gradient: 'from-stone-50 to-amber-100',
            badgeBg: 'bg-stone-100 text-stone-800 border-stone-200',
            border: 'border-stone-200'
        };
    }

    if (lowerName.includes('rice bowl') || lowerName.includes('matah') || lowerName.includes('ayam')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80',
            emoji: '🍗',
            categoryLabel: 'Rice Bowl Ayam',
            gradient: 'from-orange-50 to-red-100',
            badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
            border: 'border-orange-200'
        };
    }

    // ── SNACK & CEMILAN ──
    if (lowerName.includes('fries') || lowerName.includes('kentang')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80',
            emoji: '🍟',
            categoryLabel: 'French Fries',
            gradient: 'from-yellow-50 to-amber-100',
            badgeBg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            border: 'border-yellow-200'
        };
    }

    if (lowerName.includes('platter') || lowerName.includes('mix')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
            emoji: '🍢',
            categoryLabel: 'Mix Platter',
            gradient: 'from-amber-50 to-orange-100',
            badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
            border: 'border-amber-200'
        };
    }

    if (lowerName.includes('sosis') || lowerName.includes('sausage') || lowerName.includes('bbq')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=400&q=80',
            emoji: '🌭',
            categoryLabel: 'Sosis Bakar',
            gradient: 'from-red-50 to-rose-100',
            badgeBg: 'bg-red-100 text-red-800 border-red-200',
            border: 'border-red-200'
        };
    }

    if (lowerName.includes('cireng') || lowerName.includes('rujak')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=400&q=80',
            emoji: '🥟',
            categoryLabel: 'Cireng Rujak',
            gradient: 'from-slate-50 to-amber-100',
            badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
            border: 'border-amber-200'
        };
    }

    if (lowerName.includes('tahu') || lowerName.includes('tofu')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?auto=format&fit=crop&w=400&q=80',
            emoji: '🥢',
            categoryLabel: 'Tahu Crispy',
            gradient: 'from-amber-50 to-yellow-100',
            badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
            border: 'border-amber-200'
        };
    }

    // ── ROKOK ──
    if (lowerCat.includes('rokok') || lowerName.includes('sampoerna') || lowerName.includes('surya') || lowerName.includes('marlboro') || lowerName.includes('esse') || lowerName.includes('mild')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=400&q=80',
            emoji: '🚬',
            categoryLabel: 'Rokok',
            gradient: 'from-slate-100 to-slate-200',
            badgeBg: 'bg-slate-200 text-slate-800 border-slate-300',
            border: 'border-slate-300'
        };
    }

    // ── AKSESORIS BILIAR ──
    if (lowerCat.includes('billiard') || lowerCat.includes('equipment') || lowerName.includes('sarung') || lowerName.includes('cue') || lowerName.includes('chalk') || lowerName.includes('tip')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?auto=format&fit=crop&w=400&q=80',
            emoji: '🎱',
            categoryLabel: 'Biliar',
            gradient: 'from-indigo-50 to-blue-100',
            badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            border: 'border-indigo-200'
        };
    }

    // ── GENERAL CATEGORY FALLBACKS ──
    if (lowerCat.includes('makanan') || lowerCat.includes('food')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
            emoji: '🍲',
            categoryLabel: 'Makanan',
            gradient: 'from-orange-50 to-amber-100',
            badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
            border: 'border-orange-200'
        };
    }

    if (lowerCat.includes('snack') || lowerCat.includes('cemilan')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80',
            emoji: '🍟',
            categoryLabel: 'Snack',
            gradient: 'from-yellow-50 to-amber-100',
            badgeBg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            border: 'border-yellow-200'
        };
    }

    if (lowerCat.includes('minuman') || lowerCat.includes('beverage')) {
        return {
            imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
            emoji: '🍹',
            categoryLabel: 'Minuman',
            gradient: 'from-sky-50 to-blue-100',
            badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
            border: 'border-sky-200'
        };
    }

    // Default Fallback
    return {
        imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80',
        emoji: '🍽️',
        categoryLabel: category || 'Menu',
        gradient: 'from-slate-50 to-slate-100',
        badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
        border: 'border-slate-200'
    };
};
