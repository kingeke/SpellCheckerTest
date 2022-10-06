import { Quill } from "react-quill";

let Inline = Quill.import("blots/inline");

class SpellCheckBlot extends Inline {
	static blotName = "spellCheckError";
	static tagName = "span";
	static className = "spell-check-error";

	static create(initialValue) {
		const node = super.create();
		return node;
	}

	constructor(domNode, value) {
		super(domNode);

		if (value?.id) {
			domNode.setAttribute("id", value.id);
		}
		if (value?.click) {
			domNode.addEventListener("click", value.click);
		}
	}

	static formats() {
		return true;
	}
}

export default SpellCheckBlot;
