export class Interface {
  requireFunction(name, ...args) {
    setTimeout(() => {
      if (typeof this[name] !== "function")
        throw new Error(name + " is not implemented");
    }, 0);
  }
}
