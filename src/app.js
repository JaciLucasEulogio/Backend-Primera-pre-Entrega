const express = require("express");
const fs = require("fs").promises;
const app = express();
const port = 8080;

// Middleware para habilitar el uso de JSON en las solicitudes
app.use(express.json());

// Rutas para productos
const productsRouter = express.Router();
app.use("/api/products", productsRouter);

const productsFile = "products.json";

// Listar todos los productos
productsRouter.get("/:pid", async (req, res) => {
  try {
    const data = await fs.readFile(productsFile, "utf8");
    const products = JSON.parse(data);
    const requestedId = req.params.pid;
    console.log("Datos de productos:", products);
    console.log("ID solicitado:", requestedId);
    const product = products.find((p) => p.id === requestedId);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: "Producto no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al obtener producto" });
  }
});

// Obtener un productos
productsRouter.get("/", async (req, res) => {
  try {
    const data = await fs.readFile(productsFile, "utf8");
    const products = JSON.parse(data);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

function generateProductId(products) {
  const maxId = products.reduce((max, product) => {
    return product.id > max ? product.id : max;
  }, 0);

  let uniqueId;
  let isUnique = false;

  while (!isUnique) {
    uniqueId = maxId + 1;
    isUnique = !products.some((product) => parseInt(product.id) === uniqueId);
  }
  return uniqueId;
}

// Agregar un nuevo producto
productsRouter.post("/", async (req, res) => {
  try {
    const data = await fs.readFile(productsFile, "utf8");
    const products = JSON.parse(data);

    // Genera un nuevo ID único como número
    const newProductId = generateProductId(products);

    const newProduct = {
      id: newProductId,
      title: req.body.title,
      description: req.body.description,
      code: req.body.code,
      price: req.body.price,
      status: req.body.status !== undefined ? req.body.status : true,
      stock: req.body.stock,
      category: req.body.category || "",
      thumbnails: req.body.thumbnails || [],
    };

    if (
      newProduct.title &&
      newProduct.description &&
      newProduct.code &&
      newProduct.price &&
      newProduct.stock
    ) {
      products.push(newProduct);
      await fs.writeFile(
        productsFile,
        JSON.stringify(products, null, 2),
        "utf8"
      );
      res.json(newProduct);
    } else {
      res.status(400).json({ error: "Faltan campos obligatorios" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al agregar producto" });
  }
});

// Actualizar un producto por ID
productsRouter.put("/:pid", async (req, res) => {
  try {
    const data = await fs.readFile(productsFile, "utf8");
    const products = JSON.parse(data);
    const productIndex = products.findIndex((p) => p.id === req.params.pid);
    if (productIndex !== -1) {
      const updatedProduct = { ...products[productIndex], ...req.body };

      updatedProduct.id = req.params.pid;

      products[productIndex] = updatedProduct;
      await fs.writeFile(
        productsFile,
        JSON.stringify(products, null, 2),
        "utf8"
      );
      res.json(updatedProduct);
    } else {
      res.status(404).json({ error: "Producto no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});

// Eliminar un producto por ID
productsRouter.delete("/:pid", async (req, res) => {
  try {
    const data = await fs.readFile(productsFile, "utf8");
    let products = JSON.parse(data);
    const productIndex = products.findIndex((p) => p.id === req.params.pid);
    if (productIndex !== -1) {
      products = products.filter((p) => p.id !== req.params.pid);
      await fs.writeFile(
        productsFile,
        JSON.stringify(products, null, 2),
        "utf8"
      );
      res.json({ message: "Producto eliminado" });
    } else {
      res.status(404).json({ error: "Producto no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});

// Rutas para carritos
const cartsRouter = express.Router();
app.use("/api/carts", cartsRouter);

const cartsFile = "carrito.json";

function generateCartId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Crear un nuevo carrito
cartsRouter.post("/", async (req, res) => {
  try {
    const newCart = {
      id: generateCartId(),
      products: [],
    };
    const data = await fs.readFile(cartsFile, "utf8");
    const carts = JSON.parse(data);
    carts.push(newCart);
    await fs.writeFile(cartsFile, JSON.stringify(carts, null, 2), "utf8");
    res.json(newCart);
  } catch (error) {
    res.status(500).json({ error: "Error al crear carrito" });
  }
});

// Listar productos en un carrito por ID de carrito
cartsRouter.get("/:cid", async (req, res) => {
  try {
    const data = await fs.readFile(cartsFile, "utf8");
    const carts = JSON.parse(data);
    const cart = carts.find((c) => c.id === req.params.cid);
    if (cart) {
      res.json(cart.products);
    } else {
      res.status(404).json({ error: "Carrito no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al obtener productos del carrito" });
  }
});

// Agregar un producto a un carrito por ID de carrito y ID de producto
cartsRouter.post("/:cid/product/:pid", async (req, res) => {
  try {
    const data = await fs.readFile(cartsFile, "utf8");
    let carts = JSON.parse(data);
    const cartIndex = carts.findIndex((c) => c.id === req.params.cid);
    if (cartIndex !== -1) {
      const productToAdd = req.params.pid;
      const quantityToAdd = req.body.quantity || 1; // Agregar uno por defecto si no se especifica la cantidad
      const cart = carts[cartIndex];
      const existingProduct = cart.products.find(
        (p) => p.product === productToAdd
      );
      if (existingProduct) {
        existingProduct.quantity += quantityToAdd;
      } else {
        cart.products.push({ product: productToAdd, quantity: quantityToAdd });
      }
      await fs.writeFile(cartsFile, JSON.stringify(carts, null, 2), "utf8");
      res.json(cart.products);
    } else {
      res.status(404).json({ error: "Carrito no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al agregar producto al carrito" });
  }
});

// Función para generar IDs únicos para productos
function generateProductId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Función para generar IDs únicos para carritos
function generateCartId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

app.listen(port, () => {
  console.log(`Servidor Express en funcionamiento en el puerto ${port}`);
});
