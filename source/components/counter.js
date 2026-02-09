import React from 'react';
import { Text, useStdout } from 'ink';

const { useState } = require('react')

export default function Counter({ text = 'counter: ', initialValue, step }) {

	let [output, setOutput] = useState("");
	const { stdout, write } = useStdout();

	const [counter, setCounter] = React.useState(initialValue);

	if (false) React.useEffect(() => {
		const timer = setInterval(() => {
			setCounter(prevCounter => prevCounter + step); // eslint-disable-line unicorn/prevent-abbreviations
		}, 100);

		return () => {
			clearInterval(timer);
		};
	}, []);

	return (

		<Text>{text} {counter}</Text>
	);
}
