use core::default::Default;

#[derive(Debug, Default)]
pub struct Context<T> {
   pub stack: Vec<T>,
}

impl<T: Default> Context<T> {
   #[inline]
   pub fn enter(&mut self) {
      self.enter_with(T::default());
   }
}

impl<T> Context<T> {
   #[inline]
   pub fn enter_with(&mut self, value: T) {
      self.stack.push(value);
   }

   /// ### Warning!
   /// Only use this method when you are sure that the stack is not empty.
   /// Otherwise, use `exit_safe` instead.
   #[inline]
   pub fn exit(&mut self) -> T {
      return self.exit_safe().expect("Context stack is empty.");
   }

   #[inline]
   pub fn exit_safe(&mut self) -> Option<T> {
      return self.stack.pop();
   }

   /// ### Warning!
   /// Only use this method when you are sure that `stack` is not empty.
   /// Otherwise, use `get_safe` instead.
   #[inline]
   pub fn get(&self) -> &T {
      return self.get_safe().expect("Context stack is empty.");
   }

   #[inline]
   pub fn get_safe(&self) -> Option<&T> {
      return self.stack.last();
   }

   /// ### Warning!
   /// Only use this method when you are sure that `stack` is not empty.
   /// Otherwise, use `get_mut_safe` instead.
   #[inline]
   pub fn get_mut(&mut self) -> &mut T {
      return self.get_mut_safe().expect("Context stack is empty.");
   }

   #[inline]
   pub fn get_mut_safe(&mut self) -> Option<&mut T> {
      return self.stack.last_mut();
   }

   /// ### Warning!
   /// Only use this method when you are sure that `stack` is not empty.
   /// Otherwise, use `tail_safe` instead.
   #[inline]
   pub fn tail(&self) -> &T {
      return self.tail_safe().expect("Context stack is empty.");
   }

   #[inline]
   pub fn tail_safe(&self) -> Option<&T> {
      return self.stack.first();
   }

   /// ### Warning!
   /// Only use this method when you are sure that `stack` is not empty.
   /// Otherwise, use `tail_mut_safe` instead.
   #[inline]
   pub fn tail_mut(&mut self) -> &mut T {
      return self.tail_mut_safe().expect("Context stack is empty.");
   }

   #[inline]
   pub fn tail_mut_safe(&mut self) -> Option<&mut T> {
      return self.stack.first_mut();
   }

   #[inline]
   pub fn is_tail(&self, compare: &T) -> bool {
      return self.not_empty() && std::ptr::eq(self.tail(), compare);
   }

   /// Returns the number of contexts stored in the `stack`.
   #[inline]
   pub fn size(&self) -> usize {
      return self.stack.len();
   }

   #[inline]
   pub fn is_empty(&self) -> bool {
      return self.stack.is_empty();
   }

   #[inline]
   pub fn not_empty(&self) -> bool {
      return !self.is_empty();
   }

   #[inline]
   pub fn reset(&mut self) {
      self.stack.clear();
   }

   #[inline]
   pub fn drain(&mut self) -> std::vec::Drain<'_, T> {
      return self.stack.drain(..);
   }

   #[inline]
   pub fn iter(&self) -> core::slice::Iter<'_, T> {
      return self.stack.iter();
   }

   #[inline]
   pub fn iter_mut(&mut self) -> core::slice::IterMut<'_, T> {
      return self.stack.iter_mut();
   }
}

impl<T> IntoIterator for Context<T> {
   type IntoIter = std::vec::IntoIter<T>;
   type Item = T;

   fn into_iter(self) -> Self::IntoIter {
      return self.stack.into_iter();
   }
}

impl<'a, T> IntoIterator for &'a Context<T> {
   type IntoIter = std::slice::Iter<'a, T>;
   type Item = &'a T;

   fn into_iter(self) -> Self::IntoIter {
      return self.stack.iter();
   }
}

impl<'a, T> IntoIterator for &'a mut Context<T> {
   type IntoIter = std::slice::IterMut<'a, T>;
   type Item = &'a mut T;

   fn into_iter(self) -> Self::IntoIter {
      return self.stack.iter_mut();
   }
}
