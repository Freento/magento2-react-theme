import { gql } from '@apollo/client';

export const APPLY_GIFT_CARD_TO_CART = gql`
  mutation applyGiftCardToCart($cartId: String!, $code: String!) {
    applyGiftCardToCart(input: { cart_id: $cartId, gift_card_code: $code }) {
      cart {
        id
        applied_gift_cards {
          code
          applied_balance { currency value }
          current_balance { currency value }
        }
        prices {
          grand_total { currency value }
          subtotal_excluding_tax { currency value }
          discounts { amount { currency value } label }
        }
      }
    }
  }
`;
