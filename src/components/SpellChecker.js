import axios from "axios";
import { uniqueId } from "lodash";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { fetchSuggestions } from "../actions/FetchSuggestions";
import { generateRandomCharacters } from "../helpers";
import SpellCheckBlot from "./blots/SpellCheckBlot";

export default function SpellChecker({ language }) {
	const quillRef = React.createRef();

	const [state, setState] = useState({
		spellcheckDisabled: false,
		text: "don't you worry don't you worry now heavn got a plna for you ",
		errors: [],
		highlightedErrors: [],
		ignored: [],
		dictionary: [],
	});

	const [quillEditor, setQuillEditor] = useState(null);

	//endpoint to get data from server
	useEffect(() => {
		const cancelToken = axios.CancelToken.source();

		let timeout = setTimeout(() => {
			const fetchSuggestionsData = async () => {
				const result = await fetchSuggestions(
					state.text,
					language.key,
					cancelToken.token
				);

				handleStateUpdate({ errors: result });
			};

			if (state.text?.length > 1) {
				fetchSuggestionsData();
			}
		}, 2000);

		return () => {
			clearTimeout(timeout);
			cancelToken.cancel();
		};
	}, [state.text, language]);

	//setup quill and register blots
	useEffect(() => {
		if (quillRef.current && !state.spellcheckDisabled) {
			const editor = quillRef.current.getEditor();

			setQuillEditor(editor);

			editor?.root?.setAttribute("spellcheck", false);

			handleStateUpdate({ spellcheckDisabled: true });

			Quill.register(SpellCheckBlot);
		}
	}, [quillRef, state]);

	const handleStateUpdate = (payload) => {
		setState((old) => ({ ...old, ...payload }));
	};

	const handleChange = (text) => {
		handleStateUpdate({ text });
	};

	const handlePortalClick = (text) => {
		console.log("portal click");
		console.log(text);
	};

	//handles text highlighting
	useEffect(() => {
		if (!quillEditor) return;

		let contents = state.text;

		if (!contents) return;

		let highlightedErrors = state.highlightedErrors;

		state.errors
			.filter(
				(text) =>
					!state.highlightedErrors
						.map((i) => i.text)
						.includes(text.original)
			)
			.forEach((text) => {
				let id;

				contents = contents.replace(
					new RegExp(text.original, "g"),
					`<span class="spell-check-error test-me">${text.original}</span>`
				);

				let delta = quillEditor.clipboard.convert(contents);

				delta.ops.forEach((item, index) => {
					if (!item?.attributes?.spellCheckError) return;

					id = uniqueId(
						`${item.insert}_${generateRandomCharacters(15)}`
					);

					let attributes = {
						spellCheckError: {
							click: () => handlePortalClick(item.insert),
							id,
						},
					};

					if (
						highlightedErrors.findIndex(
							(i) => i.text === item.insert
						) < 0
					) {
						highlightedErrors.push({
							id,
							text: item.insert,
							attributes,
						});
					}

					delta.ops[index].attributes = attributes;
				});

				delta.ops.push({ insert: " " });

				quillEditor.setContents(delta, "silent");
			});

		state.highlightedErrors
			.filter(
				(item) =>
					!state.errors.map((i) => i.original).includes(item.text)
			)
			.forEach((item) => {
				let regex = new RegExp(
					`<span class="spell-check-error" id="${item.text}_.*?">(.*?)</span>`
				);

				let match = contents.match(regex)?.[1];

				contents = contents.replace(regex, match);

				let delta = quillEditor.clipboard.convert(contents);

				delta.ops.forEach((item, index) => {
					if (!item?.attributes?.spellCheckError) return;

					let prevItem = state.highlightedErrors.find(
						(i) => i.text === item.insert
					);

					if (prevItem) {
						delta.ops[index].attributes = prevItem.attributes;
					}
				});

				quillEditor.setContents(delta, "silent");

				highlightedErrors = highlightedErrors.filter(
					(i) => i.id !== item.id
				);
			});

		handleStateUpdate({
			highlightedErrors,
		});
		// eslint-disable-next-line
	}, [state.errors]);

	// console.log(state);

	return (
		<div className="my-3">
			<h5>{`${language?.name} Editor`}</h5>
			<ReactQuill
				ref={quillRef}
				name="text"
				theme="snow"
				value={state.text}
				onChange={handleChange}
			></ReactQuill>
		</div>
	);
}

SpellChecker.propTypes = {
	language: PropTypes.shape({
		name: PropTypes.string,
		key: PropTypes.string,
	}),
};
