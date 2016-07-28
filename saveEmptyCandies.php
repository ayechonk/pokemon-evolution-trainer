<?php 
	$candies = file_get_contents('php://input');
	file_put_contents("data/candies.json", $candies);
	// print $pokedex;
