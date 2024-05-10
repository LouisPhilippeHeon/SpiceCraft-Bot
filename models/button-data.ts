export class ButtonData {
	name: string;
	permissions: BigInt;

	constructor(name: string, permisions?: BigInt) {
		this.name = name;
		this.permissions = permisions;
	}
}