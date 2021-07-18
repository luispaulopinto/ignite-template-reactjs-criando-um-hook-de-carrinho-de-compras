import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];

      const stockResponse = await api.get<Stock>(`/stock/${productId}`);

      const stock = stockResponse.data;

      const productExists = updatedCart.find((p) => p.id === productId);

      if (
        stock.amount < 1 ||
        (productExists && productExists.amount + 1 > stock.amount)
      ) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productExists) {
        productExists.amount += 1;
      } else {
        const productResponse = await api.get<Product>(
          `/products/${productId}`
        );

        const product = productResponse.data;

        product.amount = 1;

        updatedCart.push(product);
      }

      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      
      const productExists = cart.some((p) => p.id === productId);      
      if (!productExists) throw Error();

      const updatedCart = cart.filter((p) => p.id !== productId);

      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stockResponse = await api.get<Stock>(`/stock/${productId}`);

      const stock = stockResponse.data;

      const productFiltered = cart.find((p) => p.id === productId);

      if (
        stock.amount < 1 ||
        (productFiltered && productFiltered.amount + 1 > stock.amount)
      ) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const cartUpdated = cart.map((p) => {
        if (p.id === productId) p.amount = amount;
        return p;
      });

      setCart(cartUpdated);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartUpdated));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
