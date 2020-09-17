export class Interface {
  requireFunction(name, ...args) {
    queueMicrotask(() => {
      if (typeof this[name] !== "function")
        throw new Error(name + " is not implemented");

      if (this[name].length !== args.length)
        throw new Error(name + " has wrong arguments number");
    });
  }
}
