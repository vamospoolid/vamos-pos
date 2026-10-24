import { UnitType } from '@prisma/client';

export interface PresetRawMaterial {
  name: string;
  unit: UnitType;
  costPerUnit: number;
  currentStock: number;
  minStockAlert: number;
  purchaseUnit: string;
  conversionRatio: number;
  lastPurchasePrice: number;
}

export interface PresetRecipeItem {
  rawMaterialName: string;
  quantity: number;
}

export interface PresetProductRecipe {
  name: string;
  category: string;
  price: number;
  ingredients: PresetRecipeItem[];
}

export interface StarterPackDefinition {
  id: string;
  name: string;
  tagline: string;
  rawMaterials: PresetRawMaterial[];
  productsWithRecipes: PresetProductRecipe[];
}

export const STARTER_PACK_VAMOS_POOL_CAFE: StarterPackDefinition = {
  id: 'VAMOS_POOL_CAFE',
  name: 'Billiard Cafe & Lounge Standard Pack',
  tagline: 'Preset bahan baku lengkap, satuan belanja konversi, resep otomatis, dan kalkulasi HPP untuk Cafe & Arena Biliar',
  rawMaterials: [
    // Minuman (Drinks)
    {
      name: 'Biji Kopi Espresso Blend',
      unit: 'GRAM',
      costPerUnit: 180,
      currentStock: 2000,
      minStockAlert: 500,
      purchaseUnit: 'Pack 1 Kg',
      conversionRatio: 1000,
      lastPurchasePrice: 180000
    },
    {
      name: 'Susu UHT Full Cream',
      unit: 'MILLILITER',
      costPerUnit: 18,
      currentStock: 10000,
      minStockAlert: 2000,
      purchaseUnit: 'Dus 12 Liter',
      conversionRatio: 12000,
      lastPurchasePrice: 216000
    },
    {
      name: 'Gula Aren Cair Organik',
      unit: 'MILLILITER',
      costPerUnit: 25,
      currentStock: 3000,
      minStockAlert: 1000,
      purchaseUnit: 'Jerigen 5 Liter',
      conversionRatio: 5000,
      lastPurchasePrice: 125000
    },
    {
      name: 'Sirup Hazelnut Premium',
      unit: 'MILLILITER',
      costPerUnit: 95,
      currentStock: 1000,
      minStockAlert: 200,
      purchaseUnit: 'Botol 1 Liter',
      conversionRatio: 1000,
      lastPurchasePrice: 95000
    },
    {
      name: 'Sirup Vanilla Premium',
      unit: 'MILLILITER',
      costPerUnit: 95,
      currentStock: 1000,
      minStockAlert: 200,
      purchaseUnit: 'Botol 1 Liter',
      conversionRatio: 1000,
      lastPurchasePrice: 95000
    },
    {
      name: 'Sirup Caramel Premium',
      unit: 'MILLILITER',
      costPerUnit: 95,
      currentStock: 1000,
      minStockAlert: 200,
      purchaseUnit: 'Botol 1 Liter',
      conversionRatio: 1000,
      lastPurchasePrice: 95000
    },
    {
      name: 'Bubuk Cokelat Dark Premium',
      unit: 'GRAM',
      costPerUnit: 85,
      currentStock: 2000,
      minStockAlert: 500,
      purchaseUnit: 'Pack 1 Kg',
      conversionRatio: 1000,
      lastPurchasePrice: 85000
    },
    {
      name: 'Bubuk Matcha Green Tea',
      unit: 'GRAM',
      costPerUnit: 120,
      currentStock: 1000,
      minStockAlert: 300,
      purchaseUnit: 'Pack 1 Kg',
      conversionRatio: 1000,
      lastPurchasePrice: 120000
    },
    {
      name: 'Teh Hitam Celup / Black Tea',
      unit: 'PIECES',
      costPerUnit: 500,
      currentStock: 100,
      minStockAlert: 20,
      purchaseUnit: 'Kotak 25 Pcs',
      conversionRatio: 25,
      lastPurchasePrice: 12500
    },
    {
      name: 'Lemon Concentrate / Sari Lemon',
      unit: 'MILLILITER',
      costPerUnit: 40,
      currentStock: 2000,
      minStockAlert: 500,
      purchaseUnit: 'Botol 1 Liter',
      conversionRatio: 1000,
      lastPurchasePrice: 40000
    },
    {
      name: 'Es Batu Kristal Higienis',
      unit: 'GRAM',
      costPerUnit: 2,
      currentStock: 20000,
      minStockAlert: 5000,
      purchaseUnit: 'Karung 10 Kg',
      conversionRatio: 10000,
      lastPurchasePrice: 20000
    },

    // Makanan & Snack
    {
      name: 'Kentang Beku French Fries',
      unit: 'GRAM',
      costPerUnit: 35,
      currentStock: 5000,
      minStockAlert: 1500,
      purchaseUnit: 'Bungkus 2.5 Kg',
      conversionRatio: 2500,
      lastPurchasePrice: 87500
    },
    {
      name: 'Sosis Sapi Jumbo Bratwurst',
      unit: 'PIECES',
      costPerUnit: 5000,
      currentStock: 50,
      minStockAlert: 10,
      purchaseUnit: 'Pack 10 Pcs',
      conversionRatio: 10,
      lastPurchasePrice: 50000
    },
    {
      name: 'Nugget Ayam Crispy',
      unit: 'PIECES',
      costPerUnit: 1200,
      currentStock: 100,
      minStockAlert: 20,
      purchaseUnit: 'Bungkus 25 Pcs',
      conversionRatio: 25,
      lastPurchasePrice: 30000
    },
    {
      name: 'Cireng Salju Beku',
      unit: 'PIECES',
      costPerUnit: 800,
      currentStock: 100,
      minStockAlert: 20,
      purchaseUnit: 'Bungkus 20 Pcs',
      conversionRatio: 20,
      lastPurchasePrice: 16000
    },
    {
      name: 'Indomie Goreng Spesial',
      unit: 'PACK',
      costPerUnit: 3200,
      currentStock: 40,
      minStockAlert: 10,
      purchaseUnit: 'Dus 40 Bungkus',
      conversionRatio: 40,
      lastPurchasePrice: 128000
    },
    {
      name: 'Indomie Rebus Ayam Bawang',
      unit: 'PACK',
      costPerUnit: 3200,
      currentStock: 40,
      minStockAlert: 10,
      purchaseUnit: 'Dus 40 Bungkus',
      conversionRatio: 40,
      lastPurchasePrice: 128000
    },
    {
      name: 'Telur Ayam Segar',
      unit: 'PIECES',
      costPerUnit: 2000,
      currentStock: 60,
      minStockAlert: 15,
      purchaseUnit: 'Rak 30 Butir',
      conversionRatio: 30,
      lastPurchasePrice: 60000
    },
    {
      name: 'Kornet Sapi Kaleng',
      unit: 'GRAM',
      costPerUnit: 120,
      currentStock: 1000,
      minStockAlert: 300,
      purchaseUnit: 'Kaleng 340 Gram',
      conversionRatio: 340,
      lastPurchasePrice: 40800
    },
    {
      name: 'Keju Cheddar Olahan',
      unit: 'GRAM',
      costPerUnit: 60,
      currentStock: 1000,
      minStockAlert: 200,
      purchaseUnit: 'Blok 2 Kg',
      conversionRatio: 2000,
      lastPurchasePrice: 120000
    },
    {
      name: 'Minyak Goreng Sawit',
      unit: 'MILLILITER',
      costPerUnit: 18,
      currentStock: 5000,
      minStockAlert: 1000,
      purchaseUnit: 'Jerigen 5 Liter',
      conversionRatio: 5000,
      lastPurchasePrice: 90000
    },
    {
      name: 'Saus Sambal Ekstra Pedas',
      unit: 'GRAM',
      costPerUnit: 25,
      currentStock: 2000,
      minStockAlert: 500,
      purchaseUnit: 'Jerigen 1 Kg',
      conversionRatio: 1000,
      lastPurchasePrice: 25000
    },
    {
      name: 'Mayones Creamy',
      unit: 'GRAM',
      costPerUnit: 35,
      currentStock: 2000,
      minStockAlert: 500,
      purchaseUnit: 'Pouch 1 Kg',
      conversionRatio: 1000,
      lastPurchasePrice: 35000
    },

    // Packaging & Kemasan
    {
      name: 'Cup Plastik Bening 16oz + Lid',
      unit: 'PIECES',
      costPerUnit: 450,
      currentStock: 300,
      minStockAlert: 50,
      purchaseUnit: 'Slop 50 Pcs',
      conversionRatio: 50,
      lastPurchasePrice: 22500
    },
    {
      name: 'Sedotan Runcing Steril',
      unit: 'PIECES',
      costPerUnit: 80,
      currentStock: 500,
      minStockAlert: 100,
      purchaseUnit: 'Pack 100 Pcs',
      conversionRatio: 100,
      lastPurchasePrice: 8000
    },
    {
      name: 'Paper Bowl Snack Box',
      unit: 'PIECES',
      costPerUnit: 600,
      currentStock: 200,
      minStockAlert: 50,
      purchaseUnit: 'Slop 50 Pcs',
      conversionRatio: 50,
      lastPurchasePrice: 30000
    }
  ],
  productsWithRecipes: [
    {
      name: 'Kopi Susu Aren Vamos',
      category: 'Minuman',
      price: 22000,
      ingredients: [
        { rawMaterialName: 'Biji Kopi Espresso Blend', quantity: 18 },
        { rawMaterialName: 'Susu UHT Full Cream', quantity: 120 },
        { rawMaterialName: 'Gula Aren Cair Organik', quantity: 25 },
        { rawMaterialName: 'Es Batu Kristal Higienis', quantity: 100 },
        { rawMaterialName: 'Cup Plastik Bening 16oz + Lid', quantity: 1 },
        { rawMaterialName: 'Sedotan Runcing Steril', quantity: 1 }
      ]
    },
    {
      name: 'Iced Americano',
      category: 'Minuman',
      price: 18000,
      ingredients: [
        { rawMaterialName: 'Biji Kopi Espresso Blend', quantity: 18 },
        { rawMaterialName: 'Es Batu Kristal Higienis', quantity: 100 },
        { rawMaterialName: 'Cup Plastik Bening 16oz + Lid', quantity: 1 },
        { rawMaterialName: 'Sedotan Runcing Steril', quantity: 1 }
      ]
    },
    {
      name: 'Iced Cokelat Signature',
      category: 'Minuman',
      price: 24000,
      ingredients: [
        { rawMaterialName: 'Bubuk Cokelat Dark Premium', quantity: 30 },
        { rawMaterialName: 'Susu UHT Full Cream', quantity: 150 },
        { rawMaterialName: 'Es Batu Kristal Higienis', quantity: 100 },
        { rawMaterialName: 'Cup Plastik Bening 16oz + Lid', quantity: 1 },
        { rawMaterialName: 'Sedotan Runcing Steril', quantity: 1 }
      ]
    },
    {
      name: 'Iced Lemon Tea Segar',
      category: 'Minuman',
      price: 15000,
      ingredients: [
        { rawMaterialName: 'Teh Hitam Celup / Black Tea', quantity: 1 },
        { rawMaterialName: 'Lemon Concentrate / Sari Lemon', quantity: 25 },
        { rawMaterialName: 'Gula Aren Cair Organik', quantity: 20 },
        { rawMaterialName: 'Es Batu Kristal Higienis', quantity: 100 },
        { rawMaterialName: 'Cup Plastik Bening 16oz + Lid', quantity: 1 },
        { rawMaterialName: 'Sedotan Runcing Steril', quantity: 1 }
      ]
    },
    {
      name: 'French Fries Crispy',
      category: 'Makanan',
      price: 20000,
      ingredients: [
        { rawMaterialName: 'Kentang Beku French Fries', quantity: 150 },
        { rawMaterialName: 'Minyak Goreng Sawit', quantity: 30 },
        { rawMaterialName: 'Saus Sambal Ekstra Pedas', quantity: 25 },
        { rawMaterialName: 'Paper Bowl Snack Box', quantity: 1 }
      ]
    },
    {
      name: 'Sosis Bakar Jumbo BBQ',
      category: 'Makanan',
      price: 18000,
      ingredients: [
        { rawMaterialName: 'Sosis Sapi Jumbo Bratwurst', quantity: 1 },
        { rawMaterialName: 'Saus Sambal Ekstra Pedas', quantity: 20 },
        { rawMaterialName: 'Mayones Creamy', quantity: 15 },
        { rawMaterialName: 'Paper Bowl Snack Box', quantity: 1 }
      ]
    },
    {
      name: 'Indomie Goreng Internet (Telur Kornet)',
      category: 'Makanan',
      price: 22000,
      ingredients: [
        { rawMaterialName: 'Indomie Goreng Spesial', quantity: 1 },
        { rawMaterialName: 'Telur Ayam Segar', quantity: 1 },
        { rawMaterialName: 'Kornet Sapi Kaleng', quantity: 30 },
        { rawMaterialName: 'Saus Sambal Ekstra Pedas', quantity: 15 },
        { rawMaterialName: 'Paper Bowl Snack Box', quantity: 1 }
      ]
    },
    {
      name: 'Cireng Salju Bumbu Rujak',
      category: 'Makanan',
      price: 16000,
      ingredients: [
        { rawMaterialName: 'Cireng Salju Beku', quantity: 8 },
        { rawMaterialName: 'Minyak Goreng Sawit', quantity: 25 },
        { rawMaterialName: 'Saus Sambal Ekstra Pedas', quantity: 25 },
        { rawMaterialName: 'Paper Bowl Snack Box', quantity: 1 }
      ]
    }
  ]
};
