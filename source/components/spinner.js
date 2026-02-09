import { useState, useEffect } from "react";
import { Text } from "ink";
import cliSpinners from 'cli-spinners';

const spinner = cliSpinners.bouncingBall

const Spinner = () => {
	const [frame, setFrame] = useState(0);
	// We got this from https://github.com/sindresorhus/cli-spinners. Kudos!
	const frames = spinner.frames
	const interval = spinner.interval

	useEffect(() => {
		const timer = setInterval(() => setFrame((frame) => (frame + 1) % frames.length), interval);
		return () => clearInterval(timer);
	}, []);

	return <Text color="orange">{frames[frame]}</Text>;
};

export default Spinner;
