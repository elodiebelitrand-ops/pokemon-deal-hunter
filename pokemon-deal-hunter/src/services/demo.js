export function buildDemoDeals({ threshold = 30 }) {
  const items = [
    {
      name: 'Dracaufeu holographique édition 1',
      category: 'edition1',
      platform: 'ebay',
      foundPrice: 180,
      cmPrice: 320,
      condition: 'Bon état',
      seller: 'demo_seller_1',
      location: 'Paris',
      posted: 'démo',
      url: 'https://www.ebay.fr',
      notes: 'Mode démo : exemple de comparaison.'
    },
    {
      name: 'Pikachu shadowless',
      category: 'edition1',
      platform: 'ebay',
      foundPrice: 48,
      cmPrice: 79,
      condition: 'Très bon état',
      seller: 'demo_seller_2',
      location: 'Lyon',
      posted: 'démo',
      url: 'https://www.ebay.fr',
      notes: 'Mode démo : exemple de comparaison.'
    },
    {
      name: 'Lot cartes WOTC jungle fossile',
      category: 'magique',
      platform: 'ebay',
      foundPrice: 55,
      cmPrice: 105,
      condition: 'Correct',
      seller: 'demo_seller_3',
      location: 'Marseille',
      posted: 'démo',
      url: 'https://www.ebay.fr',
      notes: 'Mode démo : exemple de comparaison.'
    }
  ];

  return items
    .map((item) => {
      const saving = Math.round((1 - item.foundPrice / item.cmPrice) * 100);
      return {
        ...item,
        saving,
        savingEuros: Number((item.cmPrice - item.foundPrice).toFixed(2)),
        hot: saving >= 50
      };
    })
    .filter((item) => item.saving >= threshold)
    .sort((a, b) => b.saving - a.saving);
}
