// Manejador de almacenamiento
const StorageManager = {
    init() {
        this.save('personajes', ["Alba", "Diego"]);
        this.save('amigos', []);
        this.save('objetos', []); // Ahora será un array de { nombre, cantidad }
        this.save('lugaresVisitados', []);
    },

    save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    get(key) {
        return JSON.parse(localStorage.getItem(key)) || [];
    },

    add(key, item) {
        const items = this.get(key);
        if (key === 'objetos') {
            // Buscar si el objeto ya existe
            const existingItem = items.find(i => i.nombre === item);
            if (existingItem) {
                existingItem.cantidad += 1; // Incrementar cantidad si ya existe
            } else {
                items.push({ nombre: item, cantidad: 1 }); // Añadir nuevo objeto
            }
        } else if (!items.includes(item)) {
            items.push(item); // Para personajes, amigos y lugaresVisitados
        }
        this.save(key, items);
        if (key !== 'lugaresVisitados') UI.updateCharacters();
    },

    isFirstVisit(location) {
        const visited = this.get('lugaresVisitados');
        return !visited.includes(location);
    },

    markAsVisited(location) {
        this.add('lugaresVisitados', location);
    }
};

// Manejador de UI
const UI = {
    elements: {},

    initElements() {
        this.elements = {
            mainImage: document.getElementById("imagen-principal"),
            adventure: document.getElementById("aventura"),
            movementsBar: document.getElementById("barra-movimientos"),
            friendsBar: document.getElementById("barra-amigos"),
            charactersList: document.getElementById("lista-personajes"),
            friendsList: document.getElementById("lista-amigos"),
            objectsList: document.getElementById("lista-objetos")
        };

        // Verificar que todos los elementos necesarios existan
        const missingElements = Object.entries(this.elements)
            .filter(([_, el]) => !el)
            .map(([name]) => name);
        
        if (missingElements.length > 0) {
            console.error('Elementos DOM faltantes:', missingElements);
            return false;
        }
        return true;
    },

updateCharacters() {
        if (!this.elements.charactersList) return;

        const [personajes, amigos, objetos] = [
            StorageManager.get('personajes'),
            StorageManager.get('amigos'),
            StorageManager.get('objetos')
        ];

        console.log({ amigos, objetos });

        this._renderList(this.elements.charactersList, personajes, "Personajes");
        this._renderList(this.elements.friendsList, amigos, "Personajes");
        this._renderObjectList(this.elements.objectsList, objetos); // Nueva función para objetos
    },

    _renderList(container, items, folder) {
        if (!container) return;
        container.innerHTML = "";
        items.forEach(item => {
            const img = document.createElement("img");
            img.src = `${folder}/${item}.jpg`;
            img.classList.add("personaje-item");
            container.appendChild(img);
        });
    },

    _renderObjectList(container, items) {
        if (!container) return;
        container.innerHTML = "";
        items.forEach(item => {
            const div = document.createElement("div");
            div.classList.add("object-item");
            div.innerHTML = `
                <img src="Objetos/${item.nombre}.jpg" alt="${item.nombre}">
                <span class="quantity">${item.cantidad}</span>
            `;
            container.appendChild(div);
        });
    },

    createActionButton(accion) {
        const container = document.createElement("div");
        container.classList.add("boton-contenedor");

        const button = document.createElement("img");
        button.src = accion.icono;
        button.alt = accion.texto;
        button.classList.add("boton-lugar");

        const tooltip = document.createElement("span");
        tooltip.classList.add("tooltip");
        tooltip.textContent = accion.texto;

        container.appendChild(button);
        container.appendChild(tooltip);
        return { container, button };
    }
};

// Configuración de acciones
const ActionHandler = {
    actions: {
        cambio: {
            handler: (destino) => Game.changeLocation(destino),
            container: () => UI.elements.movementsBar
        },
        amigo: {
            handler: (data, currentLocation) => {
                StorageManager.add("amigos", data.amigo);
                Game.changeLocation(currentLocation);
            },
            container: () => UI.elements.friendsBar,
            shouldShow: (data) => !StorageManager.get('amigos').includes(data.amigo)
        },
        objeto: {
            handler: (data, currentLocation) => {
                StorageManager.add("objetos", data.objeto);
                Game.changeLocation(currentLocation);
            },
            container: () => UI.elements.friendsBar
        }
    },

    setupButton(accion, currentLocation) {
        const config = this.actions[accion.tipo];
        if (!config || (config.shouldShow && !config.shouldShow(accion))) return null;

        const { container, button } = UI.createActionButton(accion);
        button.onclick = () => config.handler(accion.destino || accion, currentLocation);
        const targetContainer = config.container();
        if (targetContainer) targetContainer.appendChild(container);
        return container;
    }
};

// Lugares (sin cambios)
const lugares = {
    bosque: {
        imagen: "Fondos/Bosque1.jpg",
        zona: "bosque",
        acciones: [
            { tipo: "cambio", texto: "Pasear por el bosque", destino: "bosque2", icono: "Fondos/Bosque2.jpg" }
        ]
    },
    bosque2: {
        imagen: "Fondos/Bosque2.jpg",
        zona: "bosque",
        acciones: [
            { tipo: "cambio", texto: "Pasear por el bosque", destino: "bosqueArbolMagico", icono: "Fondos/BosqueArbolMagico.jpg" },
            { tipo: "objeto", texto: "Coger la zanahoria", objeto: "zanahoria", icono: "Objetos/Zanahoria.jpg" }
        ]
    },
    bosqueArbolMagico: {
        imagen: "Fondos/BosqueArbolMagico.jpg",
        zona: "bosque",
        acciones: [
            { tipo: "cambio", texto: "Ir a la montaña", destino: "montaña", icono: "Fondos/Montaña.jpg" }
        ]
    },
    montaña: {
        imagen: "Fondos/Montaña.jpg",
        zona: "montaña",
        acciones: [
            { tipo: "cambio", texto: "Volver al arbol", destino: "bosqueArbolMagico", icono: "Fondos/BosqueArbolMagico.jpg" },
            { tipo: "cambio", texto: "Acercarse al zorro", destino: "zorroHerido", icono: "Fondos/ZorroHerido.jpg" }
        ]
    },
    zorroHerido: {
        imagen: "Fondos/ZorroHerido.jpg",
        zona: "montaña",
        acciones: [
            { tipo: "amigo", texto: "Añadir amigo", amigo: "ZorroPolar", icono: "Personajes/ZorroPolar.jpg" },
            { tipo: "cambio", texto: "Ir a la montaña", destino: "montaña", icono: "Fondos/Montaña.jpg" }
        ]
    }
};

// Controlador principal del juego
const Game = {
	    locationMessages: {
        bosque: "¡Bienvenido al bosque! Un lugar lleno de misterios te espera.",
        bosque2: "Has encontrado un claro en el bosque. ¡Explora con cuidado!",
        bosqueArbolMagico: "Un árbol mágico se alza ante ti. ¿Qué secretos guarda?",
        montaña: "¡Las montañas te saludan! El aire es fresco y la vista increíble.",
        zorroHerido: "Un zorro herido necesita tu ayuda. ¿Qué harás?"
    },
	
    changeLocation(location) {
        if (!UI.elements.mainImage) return; // Seguridad adicional

        const current = lugares[location];
        const amigos = StorageManager.get('amigos');

        UI.elements.mainImage.src = current.imagen;
        UI.elements.adventure.className = `zona-${current.zona}`;

        if (UI.elements.movementsBar) UI.elements.movementsBar.innerHTML = "";
        if (UI.elements.friendsBar) UI.elements.friendsBar.innerHTML = "";


        current.acciones
            .filter(accion => !(accion.destino === "zorroHerido" && amigos.includes("ZorroPolar")))
            .forEach(accion => ActionHandler.setupButton(accion, location));
		
		// Manejar primera visita
        if (StorageManager.isFirstVisit(location)) {
            StorageManager.markAsVisited(location);
            const message = this.locationMessages[location] || "¡Has llegado a un nuevo lugar!";
            this.showPopup(message);
        }

    },
	//Función para mostrar popup
    showPopup(message) {
        const popup = document.createElement('div');
        popup.className = 'popup';
        popup.innerHTML = `
            <div class="popup-content">
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.remove()">Cerrar</button>
            </div>
        `;
        document.body.appendChild(popup);

        // Opcional: cerrar automáticamente después de 5 segundos
        setTimeout(() => popup.remove(), 5000);
    },


    init() {
        if (!UI.initElements()) {
            console.error('No se pudo inicializar el juego: elementos DOM faltantes');
            return;
        }
        StorageManager.init();
        UI.updateCharacters();
        this.changeLocation("bosque");
    }
};

// Iniciar el juego cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => Game.init());