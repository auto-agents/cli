import React, { useRef, useEffect } from "react";
import { render, Text, Box, useInput, useStdout } from "ink";
import { ScrollView } from "ink-scroll-view";

export default function OutputView() {
	//const scrollRef = useRef < ScrollViewRef | null > (null);
	const { stdout } = useStdout();

	// 1. Handle Terminal Resizing due to manual window change
	useEffect(() => {
		const handleResize = () => scrollRef.current?.remeasure();
		stdout?.on("resize", handleResize);
		return () => {
			stdout?.off("resize", handleResize);
		};
	}, [stdout]);

	// 2. Handle Keyboard Input
	/*useInput((input, key) => {
		if (key.upArrow) {
			scrollRef.current?.scrollBy(-1); // Scroll up 1 line
		}
		if (key.downArrow) {
			scrollRef.current?.scrollBy(1); // Scroll down 1 line
		}
		if (key.pageUp) {
			// Scroll up by viewport height
			const height = scrollRef.current?.getViewportHeight() || 1;
			scrollRef.current?.scrollBy(-height);
		}
		if (key.pageDown) {
			const height = scrollRef.current?.getViewportHeight() || 1;
			scrollRef.current?.scrollBy(height);
		}
	});*/

	return (
		<Box
			height={30}
			width="100%"
			borderStyle="single"
			borderColor="green"
			flexDirection="column"
		>
			<ScrollView >
				{Array.from({ length: 100 }).map((_, i) => (
					<Text key={i}>Item {i + 1} - content with variable length...</Text>
				))}
			</ScrollView>
		</Box>
	);
};
