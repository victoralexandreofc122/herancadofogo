// Gerado por arte/mapas/montar_chama.py (não editar à mão): a Aldeia da Chama montada com as peças do Flow.
// CHAMA_SAI: as paredes da arte antiga (FOLHA_ART) que saíram ("k:x,y,w,h"); CHAMA_NOVAS: as colisões das peças
// novas (a peça inteira, menos uma beirada); CHAMA_LUZES: janelas e lanternas; CHAMA_PLANO: a planta que mudou.
export const CHAMA_SAI: readonly string[] = ["house:3.2,6.5,5.5,14.3", "house:10.5,5.8,5.8,4.9", "house:62.6,5.8,6.65,5.3", "house:69.25,6.8,5.55,7.2", "house:70,14,5,7", "house:2.9,29.4,5.6,7.35", "house:2.9,40,6.7,7.3", "house:31.1,5.5,15.5,15", "house:50.1,10.2,14.5,11.6", "house:18.7,10.6,9.1,10.2", "house:24.6,29.4,7,5.6", "house:46.4,29.4,6.8,5.5", "house:58.5,29.4,6.5,5.6", "rock:47.3,43.8,3.1,3"];
export const CHAMA_NOVAS: readonly { k: string; s?: string; x: number; y: number; w: number; h: number }[] = [
  {"k": "house", "s": "home", "x": 3.76, "y": 9.24, "w": 4.39, "h": 3.97},
  {"k": "house", "s": "home", "x": 3.58, "y": 16.05, "w": 4.81, "h": 4.34},
  {"k": "house", "s": "hut", "x": 11.2, "y": 5.61, "w": 4.35, "h": 4.82},
  {"k": "house", "s": "home", "x": 64.76, "y": 6.49, "w": 4.81, "h": 4.34},
  {"k": "house", "s": "home", "x": 69.76, "y": 9.74, "w": 4.39, "h": 3.97},
  {"k": "house", "s": "hut", "x": 70.33, "y": 15.93, "w": 4.35, "h": 4.82},
  {"k": "house", "s": "home", "x": 3.45, "y": 32.42, "w": 4.39, "h": 3.97},
  {"k": "house", "s": "home", "x": 3.76, "y": 42.67, "w": 4.81, "h": 4.34},
  {"k": "house", "s": "leader", "x": 33.64, "y": 10.74, "w": 10.35, "h": 9.59},
  {"k": "house", "s": "academy", "x": 52.01, "y": 11.36, "w": 10.6, "h": 10.26},
  {"k": "house", "s": "hospital", "x": 20.89, "y": 16.68, "w": 4.64, "h": 3.97},
  {"k": "house", "s": "shop_weapon", "x": 25.7, "y": 31.05, "w": 4.68, "h": 3.78},
  {"k": "house", "s": "shop_cloth", "x": 47.64, "y": 30.8, "w": 4.27, "h": 3.92},
  {"k": "house", "s": "shop_scroll", "x": 59.45, "y": 31.05, "w": 4.58, "h": 3.78},
  {"k": "rock", "x": 47.64, "y": 44.55, "w": 2.39, "h": 2.15},
];
export const CHAMA_LUZES: readonly { x: number; y: number }[] = [{"x": 4.4, "y": 11.7}, {"x": 7.5, "y": 11.7}, {"x": 4.7, "y": 18.6}, {"x": 65.9, "y": 9.1}, {"x": 70.4, "y": 12.2}, {"x": 73.5, "y": 12.2}, {"x": 4.1, "y": 34.9}, {"x": 7.2, "y": 34.9}, {"x": 4.9, "y": 45.2}, {"x": 37.1, "y": 10.6}, {"x": 35.0, "y": 12.8}, {"x": 35.0, "y": 11.3}, {"x": 34.8, "y": 14.3}, {"x": 42.8, "y": 14.3}, {"x": 35.1, "y": 14.4}, {"x": 34.9, "y": 15.8}, {"x": 34.5, "y": 16.2}, {"x": 57.3, "y": 19.0}, {"x": 22.7, "y": 19.7}, {"x": 24.6, "y": 20.2}, {"x": 24.6, "y": 20.5}, {"x": 27.0, "y": 34.2}, {"x": 47.8, "y": 31.1}, {"x": 50.6, "y": 32.8}, {"x": 48.1, "y": 33.3}, {"x": 50.9, "y": 33.5}, {"x": 49.7, "y": 33.5}, {"x": 60.1, "y": 33.4}, {"x": 62.3, "y": 33.4}, {"x": 49.2, "y": 45.5}];
export const CHAMA_PLANO = {"academy": {"x": 52.01, "y": 11.36, "w": 10.6, "h": 10.26}, "shops": {"weapons": {"x": 25.7, "y": 31.05, "w": 4.68, "h": 3.78}, "clothes": {"x": 47.64, "y": 30.8, "w": 4.27, "h": 3.92}, "scrolls": {"x": 59.45, "y": 31.05, "w": 4.58, "h": 3.78}}, "well": {"x": 47.64, "y": 44.55, "w": 2.39, "h": 2.15}} as const;
