const WEEK_DATA = {
  meta: {
    week: "16–22 junio 2025",
    generated: "2025-06-16"
  },
  days: [
    {
      id: "lun", label: "Lunes", date: "16 jun",
      lunch: {
        name: "Lentejas estofadas con verduras",
        tags: ["legumbres"],
        time: 35,
        prepAhead: true,
        freezer: false,
        ingredients: ["250 g lentejas pardinas (bote)", "1 zanahoria", "1 cebolla", "2 dientes ajo", "1 pimiento rojo", "1 tomate maduro", "1 patata mediana", "Pimentón, comino, aceite, sal", "500 ml caldo de verduras"],
        steps: ["Sofreír cebolla, ajo y pimiento hasta dorar.", "Añadir tomate rallado y pimentón, 2 min.", "Incorporar lentejas escurridas, zanahoria y patata en cubos.", "Cubrir con caldo. Cocinar 25 min (10 min si son de bote).", "Ajustar sal y comino al gusto."],
        rating: 4
      },
      dinner: {
        name: "Pechuga al limón con ensalada",
        tags: ["rapida", "airfryer"],
        time: 20,
        prepAhead: false,
        freezer: false,
        ingredients: ["2 pechugas de pollo", "1 limón (zumo y ralladura)", "Ajo en polvo, orégano, sal", "Lechuga, tomate cherry, pepino", "Aceite de oliva, vinagre"],
        steps: ["Marinar pechuga con limón, ajo y orégano 10 min.", "Airfryer 200°C, 12 min (dando la vuelta a mitad).", "Preparar ensalada y aliñar. Servir con la pechuga laminada."],
        rating: 3
      }
    },
    {
      id: "mar", label: "Martes", date: "17 jun",
      lunch: {
        name: "Merluza al horno con patatas",
        tags: ["pescado"],
        time: 40,
        prepAhead: false,
        freezer: false,
        ingredients: ["2 lomos de merluza (~350 g)", "2 patatas medianas", "1 pimiento rojo y 1 verde", "1 cebolla en juliana", "Aceite, sal, pimentón, ajo en polvo", "Perejil fresco"],
        steps: ["Horno 200°C. Patatas en rodajas con cebolla y pimientos, 20 min.", "Colocar merluza encima de las verduras ya cocinadas.", "Aliñar con aceite y pimentón. Hornear 12–15 min más.", "Terminar con perejil fresco picado."],
        rating: 5
      },
      dinner: {
        name: "Pan con tomate y jamón",
        tags: ["rapida", "sin cocinar"],
        time: 5,
        prepAhead: false,
        freezer: false,
        ingredients: ["Pan de cristal o barra", "2 tomates maduros", "Jamón serrano o ibérico", "Aceite de oliva, sal"],
        steps: ["Tostar el pan si se desea.", "Frotar con tomate partido por la mitad.", "Añadir aceite, sal y jamón. Listo."],
        rating: 4
      }
    },
    {
      id: "mie", label: "Miércoles", date: "18 jun",
      lunch: {
        name: "Pasta con tomate y calabacín",
        tags: ["vegetariano"],
        time: 25,
        prepAhead: true,
        freezer: false,
        ingredients: ["200 g pasta (penne o rigatoni)", "1 calabacín mediano", "1 bote tomate triturado (400 g)", "2 dientes ajo, albahaca", "Mozzarella rallada para gratinar", "Aceite, sal, pizca azúcar"],
        steps: ["Saltear ajo y calabacín en cubos hasta dorar.", "Añadir tomate, sal y pizca azúcar. Cocinar 15 min.", "Cocer pasta al dente. Mezclar con la salsa.", "Gratinar con mozzarella si se desea."],
        rating: 4
      },
      dinner: {
        name: "Tortilla española",
        tags: ["vegetariano", "rapida"],
        time: 25,
        prepAhead: true,
        freezer: false,
        ingredients: ["4 huevos", "3 patatas medianas", "1 cebolla (opcional)", "Aceite abundante, sal"],
        steps: ["Pelar y laminar patatas. Freír a fuego medio con cebolla hasta que estén tiernas.", "Escurrir bien el aceite. Batir huevos con sal.", "Mezclar patatas con huevo batido. Reposar 5 min.", "Cuajar en sartén a fuego medio por ambos lados."],
        rating: 5
      }
    },
    {
      id: "jue", label: "Jueves", date: "19 jun",
      lunch: {
        name: "Garbanzos con espinacas y huevo",
        tags: ["legumbres", "vegetariano"],
        time: 20,
        prepAhead: false,
        freezer: false,
        ingredients: ["1 bote garbanzos cocidos (400 g)", "150 g espinacas frescas", "2 huevos", "2 dientes ajo, comino, pimentón ahumado", "1 tomate maduro", "Aceite, sal"],
        steps: ["Sofreír ajo, tomate y especias 5 min.", "Añadir garbanzos escurridos y espinacas. Remover hasta que reduzcan.", "Pochar huevos en agua con vinagre (3–4 min).", "Servir los garbanzos con el huevo pochado encima."],
        rating: 4
      },
      dinner: {
        name: "Salmón airfryer con brócoli",
        tags: ["pescado", "airfryer", "rapida"],
        time: 20,
        prepAhead: false,
        freezer: true,
        ingredients: ["2 lomos de salmón (~200 g cada uno)", "1 brócoli mediano en ramitos", "Limón, ajo en polvo, eneldo", "Aceite de oliva, sal, pimienta"],
        steps: ["Aliñar salmón con aceite, ajo, eneldo, sal y zumo de limón.", "Airfryer 200°C: brócoli 8 min primero.", "Añadir salmón junto al brócoli. 10–12 min más."],
        rating: 5
      }
    },
    {
      id: "vie", label: "Viernes", date: "20 jun",
      lunch: {
        name: "Arroz con pollo al sofrito",
        tags: ["carne"],
        time: 40,
        prepAhead: false,
        freezer: false,
        ingredients: ["2 contramuslos pollo sin hueso", "180 g arroz redondo", "1 pimiento rojo, 1 tomate, 1 cebolla, 2 dientes ajo", "Pimentón, azafrán (o colorante), sal", "450 ml caldo de pollo"],
        steps: ["Dorar pollo troceado en aceite. Retirar.", "Sofreír cebolla, ajo, pimiento y tomate rallado.", "Añadir pimentón, pollo y arroz. Mezclar 1 min.", "Caldo caliente. Cocinar 18 min sin remover.", "Reposar 5 min tapado antes de servir."],
        rating: 4
      },
      dinner: {
        name: "Pizza casera airfryer",
        tags: ["especial", "airfryer"],
        time: 15,
        prepAhead: false,
        freezer: false,
        ingredients: ["2 bases pizza frescas (Mercadona)", "Salsa de tomate (bote pequeño)", "1 bola mozzarella fresca", "Jamón, champiñones, orégano a gusto"],
        steps: ["Extender salsa de tomate sobre la base.", "Añadir mozzarella laminada y toppings elegidos.", "Airfryer 200°C, 8–10 min hasta que dore.", "Orégano fresco al sacar."],
        rating: 5
      }
    },
    {
      id: "sab", label: "Sábado", date: "21 jun",
      lunch: {
        name: "Berenjenas rellenas al horno",
        tags: ["carne"],
        time: 45,
        prepAhead: true,
        freezer: false,
        ingredients: ["2 berenjenas medianas", "250 g carne picada mixta", "1 tomate, 1 cebolla, 2 dientes ajo", "Mozzarella rallada para gratinar", "Orégano, sal, aceite de oliva"],
        steps: ["Partir berenjenas, marcar con cuchillo. Horno 200°C, 20 min.", "Vaciar pulpa con cuchara. Reservar.", "Sofreír cebolla, ajo, carne y pulpa con tomate.", "Rellenar las berenjenas con el sofrito.", "Cubrir con mozzarella. Gratinar 10 min."],
        rating: 4
      },
      dinner: {
        name: "Gazpacho con fuet y tostadas",
        tags: ["sin cocinar", "rapida"],
        time: 5,
        prepAhead: true,
        freezer: false,
        ingredients: ["1 L gazpacho (brick Mercadona o casero)", "Fuet o lomo embuchado", "Pan tostado", "Aceite de oliva, sal"],
        steps: ["Servir gazpacho muy frío.", "Acompañar con fuet en rodajas y tostadas con aceite."],
        rating: 3
      }
    },
    {
      id: "dom", label: "Domingo", date: "22 jun",
      lunch: {
        name: "Dorada a la sal con patatas",
        tags: ["pescado"],
        time: 35,
        prepAhead: false,
        freezer: false,
        ingredients: ["1 dorada entera (~600 g)", "1 kg sal gorda", "3 patatas medianas", "Romero, tomillo, limón", "Aceite de oliva virgen"],
        steps: ["Patatas en rodajas con aceite y hierbas. Horno 200°C, 25 min.", "Cubrir dorada completamente con sal gorda.", "Hornear 25 min a 200°C.", "Romper costra de sal con cuchara. Servir con aceite y limón."],
        rating: 5
      },
      dinner: {
        name: "Revuelto de champiñones y espárragos",
        tags: ["vegetariano", "rapida"],
        time: 15,
        prepAhead: false,
        freezer: false,
        ingredients: ["200 g champiñones laminados", "1 manojo espárragos trigueros", "4 huevos", "2 dientes ajo", "Aceite, sal, pimienta"],
        steps: ["Saltear ajo, champiñones y espárragos 5–7 min.", "Batir huevos y añadir a fuego bajo.", "Remover suavemente hasta cuajar. Servir enseguida."],
        rating: 4
      }
    }
  ],
  shopping: [
    {
      section: "Fruta y verdura", icon: "🥦",
      items: [
        { name: "Cebollas", qty: "5 und" },
        { name: "Tomates maduros", qty: "6 und" },
        { name: "Pimientos rojos", qty: "4 und" },
        { name: "Pimientos verdes", qty: "2 und" },
        { name: "Calabacín", qty: "2 medianos" },
        { name: "Berenjenas", qty: "2 medianas" },
        { name: "Zanahorias", qty: "2 und" },
        { name: "Brócoli", qty: "1 mediano" },
        { name: "Espinacas frescas", qty: "200 g" },
        { name: "Champiñones", qty: "200 g" },
        { name: "Espárragos trigueros", qty: "1 manojo" },
        { name: "Patatas", qty: "2 kg" },
        { name: "Limones", qty: "3 und" },
        { name: "Ajo (cabeza)", qty: "1 cabeza" },
        { name: "Lechuga o mezclum", qty: "1 bolsa" },
        { name: "Tomate cherry", qty: "250 g" }
      ]
    },
    {
      section: "Carnicería", icon: "🥩",
      items: [
        { name: "Pechugas de pollo", qty: "2 filetes" },
        { name: "Contramuslos s/hueso", qty: "2 und" },
        { name: "Carne picada mixta", qty: "250 g" },
        { name: "Jamón serrano", qty: "100 g" },
        { name: "Fuet o lomo embuchado", qty: "1 pieza" }
      ]
    },
    {
      section: "Pescadería", icon: "🐟",
      items: [
        { name: "Lomos de merluza", qty: "2 lomos (~350 g)" },
        { name: "Lomos de salmón", qty: "2 lomos (~400 g)" },
        { name: "Dorada entera", qty: "1 und (~600 g)" }
      ]
    },
    {
      section: "Refrigerados y lácteos", icon: "🥛",
      items: [
        { name: "Huevos", qty: "12 und" },
        { name: "Mozzarella fresca (bola)", qty: "2 bolas" },
        { name: "Mozzarella rallada", qty: "200 g" },
        { name: "Queso suave para untar", qty: "1 cuña" },
        { name: "Bases pizza frescas", qty: "2 und" }
      ]
    },
    {
      section: "Conservas", icon: "🥫",
      items: [
        { name: "Lentejas pardinas (bote)", qty: "1 × 400 g" },
        { name: "Garbanzos cocidos (bote)", qty: "1 × 400 g" },
        { name: "Tomate triturado", qty: "2 × 400 g" },
        { name: "Salsa de tomate pizza", qty: "1 bote pequeño" },
        { name: "Caldo de pollo/verduras", qty: "1 L tetrabrik" }
      ]
    },
    {
      section: "Pasta y arroz", icon: "🍝",
      items: [
        { name: "Pasta (penne o rigatoni)", qty: "250 g" },
        { name: "Arroz redondo", qty: "250 g" }
      ]
    },
    {
      section: "Panadería", icon: "🥖",
      items: [
        { name: "Pan de cristal o barra", qty: "2 barras" },
        { name: "Pan tostado (paquete)", qty: "1 paquete" }
      ]
    },
    {
      section: "Agua", icon: "💧",
      items: [
        { name: "Garrafas agua 5 L", qty: "7 garrafas" }
      ]
    },
    {
      section: "Otros", icon: "🛒",
      items: [
        { name: "Sal gorda (para dorada)", qty: "1 kg" },
        { name: "Gazpacho brick Mercadona", qty: "1 L" },
        { name: "Aceite de oliva virgen extra", qty: "reponer si falta" },
        { name: "Pimentón dulce + ahumado", qty: "reponer si falta" },
        { name: "Orégano, eneldo, comino", qty: "reponer si falta" }
      ]
    }
  ],
  prepSunday: [
    { task: "Preparar sofrito doble de tomate", detail: "Sirve para lentejas, pasta, arroz y berenjenas", done: false },
    { task: "Hacer gazpacho", detail: "Se conserva 4–5 días en nevera", done: false },
    { task: "Cocer 5–6 huevos duros", detail: "Para ensaladas, gazpacho y la tortilla", done: false },
    { task: "Lavar y cortar toda la verdura", detail: "Guardar en tupper en la nevera", done: false },
    { task: "Sacar salmón del congelador", detail: "Para la cena del jueves", done: false },
    { task: "Preparar la marinada del pollo", detail: "Limón y especias para el lunes noche", done: false }
  ],
  freezer: {
    today: [],
    tomorrow: [
      { item: "Lomos de salmón", for: "Cena del jueves" }
    ]
  },
  water: {
    weeklyLitres: 35,
    bottleSize: 5,
    bottlesNeeded: 7,
    bottlesHome: 2
  }
};

window.WEEK_DATA = WEEK_DATA;
