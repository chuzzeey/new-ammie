export function getProductDescription(productName: string): string {
  const name = productName.trim()
  
  // Varied descriptions with product name in different positions
  const descriptions = [
    // Name at start
    `${name} delivers premium quality and stunning style. Expertly crafted with high-quality materials for a natural, comfortable fit. This versatile piece offers realistic appearance and durable construction, perfect for enhancing your everyday look or special occasions.`,
    
    // Name in middle
    `Discover premium quality with this expertly crafted piece. ${name} features natural movement, realistic texture, and comfortable all-day wear. Perfect for creating stunning styles for any occasion.`,
    
    // Name at end
    `Expertly designed with attention to detail and premium craftsmanship. This natural-looking piece offers comfortable wear and versatile styling options. Transform your appearance with beautiful ${name}.`,
    
    // Name appears twice - start and middle
    `${name} represents the perfect blend of quality and style. Expertly constructed with superior materials, ${name} delivers natural movement and realistic appearance for stunning results every time.`,
    
    // Name appears twice - middle and end
    `Experience luxury and comfort with this premium piece. Featuring natural-looking design and expert craftsmanship, ${name} offers versatile styling for any occasion. Discover the beauty of ${name}.`,
    
    // Name appears twice - start and end
    `${name} sets a new standard in premium hair products. Meticulously crafted with top-grade materials for natural movement and realistic styling. Transform your look with the exceptional ${name}.`,
    
    // Name only once in middle
    `Elevate your beauty routine with this premium product. Featuring superior craftsmanship and high-quality materials, ${name} delivers natural-looking results and comfortable all-day wear for any occasion.`,
    
    // Name only once at start
    `${name} combines expert design with premium quality for stunning results. This natural-looking piece offers comfortable wear, realistic appearance, and versatile styling options perfect for everyday elegance.`,
    
    // Name only once at end
    `Meticulously crafted with attention to detail, this premium piece offers natural movement and realistic texture. Perfect for enhancing your natural beauty with gorgeous ${name}.`,
    
    // Name in middle with emphasis
    `Discover the perfect hair solution. ${name} features premium quality construction, natural movement, and comfortable fit. Expertly designed for realistic appearance and effortless styling every day.`,
    
    // Name at start with benefits
    `${name} offers unmatched quality and style. Premium materials ensure natural-looking beauty and comfortable all-day wear. This versatile piece delivers stunning results for any occasion.`,
    
    // Name at end with features
    `Expertly crafted with superior materials for natural movement and realistic appearance. This comfortable, versatile piece offers effortless styling. Enhance your beauty with premium ${name}.`,
    
    // Name appears twice - separated
    `Transform your look with premium quality. ${name} delivers natural movement and realistic texture. Experience the confidence of beautiful hair with stunning ${name}.`,
    
    // Name in middle with action
    `Unleash your beauty potential with this expertly designed piece. ${name} features premium construction and natural-looking design for comfortable, versatile styling. Elevate your everyday style.`,
    
    // Name at start with transformation
    `${name} transforms your hair game with premium quality and expert design. Natural movement, realistic appearance, and comfortable fit make this piece perfect for any occasion.`,
    
    // Name only once - descriptive middle
    `Experience the luxury of premium hair products. ${name} offers superior craftsmanship, natural-looking beauty, and comfortable all-day wear. Perfect for creating stunning, effortless styles.`,
    
    // Name at end with benefits
    `Expertly constructed with high-quality materials for superior performance. This natural, realistic piece offers versatile styling and comfortable wear. Discover beautiful results with ${name}.`,
    
    // Name appears twice - start and middle
    `${name} redefines premium hair quality. Expertly crafted with attention to detail, ${name} delivers natural movement, realistic texture, and comfortable fit for stunning everyday style.`,
    
    // Name in middle with elegance
    `Indulge in luxury with this premium piece. ${name} combines expert craftsmanship with beautiful design for natural-looking results. Transform your appearance with effortless elegance.`,
    
    // Name only once - action oriented
    `Elevate your natural beauty with this expertly designed product. ${name} features premium materials, realistic appearance, and comfortable wear for stunning, versatile styling options.`,
    
    // Name at start with confidence
    `${name} gives you confidence with every wear. Premium quality construction ensures natural movement and realistic styling. This comfortable piece is perfect for everyday elegance.`,
    
    // Name at end with quality
    `Superior craftsmanship and premium materials deliver natural-looking beauty. This versatile piece offers comfortable all-day wear and effortless styling. Experience premium ${name}.`,
    
    // Name appears twice - middle emphasis
    `Discover premium hair perfection. Expertly crafted with ${name} for natural movement and realistic appearance. Transform your style with the exceptional quality of ${name}.`,
    
    // Name in middle with versatility
    `Experience effortless beauty with this versatile piece. ${name} features premium construction, natural texture, and comfortable fit. Perfect for creating stunning looks for any occasion.`,
    
    // Name only once - benefit focused
    `Enhance your natural beauty with premium quality. ${name} delivers realistic appearance, comfortable wear, and versatile styling options for effortless, stunning results every day.`,
    
    // Name at start with craftsmanship
    `${name} showcases expert craftsmanship and premium design. Natural movement, realistic texture, and comfortable fit make this piece ideal for elevating your everyday style.`,
    
    // Name at end with transformation
    `Expertly designed with superior materials for natural-looking beauty. This comfortable, versatile piece delivers stunning results. Transform your hair with beautiful ${name}.`,
    
    // Name appears twice - quality focus
    `Premium quality meets stunning design with ${name}. Expertly crafted for natural movement and realistic appearance. Discover the difference with ${name}.`,
    
    // Name in middle with comfort
    `Achieve effortless style with this premium product. ${name} offers comfortable all-day wear, natural movement, and realistic appearance. Perfect for any occasion.`,
    
    // Name only once - style focused
    `Transform your beauty routine with expertly crafted design. ${name} features premium materials, realistic texture, and versatile styling for stunning, natural-looking results.`,
    
    // Name at start with versatility
    `${name} offers versatile styling for every occasion. Premium construction ensures natural movement and realistic appearance. This comfortable piece delivers effortless beauty.`,
    
    // Name at end with elegance
    `Superior design and premium quality create natural-looking beauty. This comfortable, realistic piece offers versatile styling options. Elevate your style with ${name}.`,
    
    // Name appears twice - start and end emphasis
    `${name} delivers exceptional quality and style. Expertly crafted with premium materials for natural beauty. Experience stunning results with beautiful ${name}.`,
    
    // Name in middle with premium feel
    `Indulge in premium hair quality. ${name} features expert craftsmanship, natural movement, and comfortable fit. Transform your look with realistic, stunning results.`,
    
    // Name only once - natural focus
    `Discover natural-looking beauty with this expertly designed piece. ${name} offers premium quality, comfortable wear, and versatile styling for effortless everyday elegance.`,
    
    // Name at start with results
    `${name} delivers stunning results every time. Premium materials ensure realistic appearance and natural movement. This comfortable piece is perfect for any occasion.`,
    
    // Name at end with confidence
    `Expertly constructed with attention to detail for superior quality. This natural, versatile piece offers comfortable wear and beautiful styling. Boost your confidence with ${name}.`,
    
    // Name appears twice - transformation theme
    `Transform your hair with premium ${name}. Expertly designed for natural movement and realistic appearance. Discover the beauty and quality of ${name}.`,
    
    // Name in middle with luxury
    `Experience luxury hair quality. ${name} combines premium materials and expert design for natural-looking beauty. This comfortable piece delivers stunning, versatile style.`,
    
    // Name only once - effortless theme
    `Effortless beauty starts with premium quality. ${name} features realistic appearance, comfortable fit, and versatile styling for stunning everyday results.`,
    
    // Name at start with detail
    `${name} is meticulously crafted for stunning results. Premium construction ensures natural movement and realistic texture. Perfect for enhancing your natural beauty.`,
    
    // Name at end with premium
    `Superior craftsmanship and beautiful design deliver natural-looking results. This comfortable, versatile piece offers effortless styling. Discover premium ${name}.`,
    
    // Name appears twice - beauty focus
    `Beautiful hair starts with ${name}. Expertly crafted with premium materials for realistic appearance. Transform your style with the exceptional quality of ${name}.`,
    
    // Name in middle with style
    `Elevate your style game with this premium piece. ${name} features expert design, natural movement, and comfortable wear for stunning, versatile results.`,
    
    // Name only once - quality emphasis
    `Premium quality and expert craftsmanship define this beautiful piece. ${name} offers natural-looking results, comfortable fit, and effortless styling for any occasion.`,
    
    // Name at start with comfort
    `${name} prioritizes comfort without compromising style. Premium materials ensure natural movement and realistic appearance. This versatile piece delivers stunning results.`,
    
    // Name at end with natural
    `Expertly designed for natural-looking beauty and comfortable wear. This realistic piece offers versatile styling options. Enhance your look with ${name}.`,
    
    // Name appears twice - elegance theme
    `Elegance meets quality with ${name}. Expertly crafted for natural movement and realistic appearance. Transform your beauty routine with stunning ${name}.`,
    
    // Name in middle with results
    `Achieve stunning hair transformation. ${name} delivers premium quality, natural texture, and comfortable fit. Perfect for creating beautiful, versatile styles.`,
    
    // Name only once - confidence builder
    `Boost your confidence with premium quality design. ${name} features realistic appearance, comfortable wear, and versatile styling for effortless, beautiful results.`,
    
    // Name at start with expert
    `${name} represents expert craftsmanship and premium design. Natural movement, realistic texture, and comfortable fit make this piece perfect for any occasion.`,
    
    // Name at end with transformation
    `Superior materials and expert construction deliver natural-looking beauty. This comfortable piece offers versatile styling. Transform your hair with ${name}.`,
    
    // Name appears twice - quality emphasis
    `Premium quality defines ${name}. Expertly crafted with attention to detail for natural movement. Discover stunning results and beautiful ${name}.`,
    
    // Name in middle with everyday
    `Perfect for everyday elegance, this piece delivers. ${name} features premium construction, realistic appearance, and comfortable wear for stunning, versatile styling.`,
    
    // Name only once - beauty focus
    `Beautiful, natural hair is achievable with premium quality. ${name} offers expert craftsmanship, comfortable fit, and realistic styling for effortless everyday beauty.`,
    
    // Name at start with versatile
    `${name} offers versatile styling for every look. Premium materials ensure natural movement and realistic appearance. This comfortable piece delivers stunning results.`,
    
    // Name at end with expert
    `Expertly designed with premium materials for superior quality. This natural-looking piece offers comfortable wear and versatile styling. Experience beautiful ${name}.`,
    
    // Name appears twice - style focus
    `Style meets quality with ${name}. Expertly crafted for natural beauty and realistic appearance. Transform your look with the exceptional ${name}.`,
    
    // Name in middle with premium
    `Discover premium hair excellence. ${name} combines expert design, natural movement, and comfortable fit for stunning, versatile styling options.`,
    
    // Name only once - natural beauty
    `Natural beauty redefined with premium quality. ${name} features realistic appearance, comfortable wear, and effortless styling for stunning everyday results.`,
    
    // Name at start with stunning
    `${name} delivers stunning beauty and quality. Expertly crafted with premium materials for natural movement. This comfortable piece is perfect for any occasion.`,
    
    // Name at end with effortless
    `Superior craftsmanship ensures natural-looking results and comfortable fit. This versatile piece offers effortless styling options. Enhance your beauty with ${name}.`,
    
    // Name appears twice - comfort focus
    `Comfort meets style with ${name}. Expertly designed for natural movement and realistic appearance. Experience premium quality with beautiful ${name}.`,
    
    // Name in middle with transformation
    `Transform your hair with expertly crafted design. ${name} features premium materials, natural texture, and comfortable wear for stunning, versatile results.`,
    
    // Name only once - premium feel
    `Premium quality and expert design create stunning results. ${name} offers natural movement, realistic appearance, and comfortable fit for effortless beauty.`,
    
    // Name at start with natural
    `${name} provides natural-looking beauty with premium quality. Expertly crafted for comfortable wear and realistic styling. This versatile piece delivers stunning results.`,
    
    // Name at end with versatile
    `Expertly constructed with superior materials for natural movement. This comfortable, realistic piece offers versatile styling. Discover beautiful ${name}.`,
    
    // Name appears twice - beauty emphasis
    `Beautiful hair is effortless with ${name}. Premium craftsmanship ensures realistic appearance and natural movement. Transform your style with ${name}.`,
    
    // Name in middle with quality
    `Experience unmatched quality with this premium piece. ${name} features expert design, natural texture, and comfortable fit for stunning everyday elegance.`,
    
    // Name only once - style emphasis
    `Stunning style starts with premium quality. ${name} delivers realistic appearance, comfortable wear, and versatile options for beautiful, natural-looking results.`,
    
    // Name at start with expert
    `${name} showcases expert craftsmanship in every detail. Premium materials ensure natural movement and realistic appearance. Perfect for elevating your style.`,
    
    // Name at end with luxury
    `Luxury meets quality with superior design and premium materials. This natural piece offers comfortable wear and versatile styling. Experience ${name}.`,
    
    // Name appears twice - results focus
    `Stunning results define ${name}. Expertly crafted with premium quality for natural beauty. Transform your look with the exceptional ${name}.`,
    
    // Name in middle with everyday
    `Everyday elegance is achievable with this piece. ${name} features premium construction, natural movement, and comfortable fit for versatile, stunning styling.`,
    
    // Name only once - transformation
    `Transform your beauty routine with expertly designed quality. ${name} offers realistic appearance, comfortable wear, and versatile styling for stunning results.`,
    
    // Name at start with realistic
    `${name} delivers realistic beauty and premium quality. Expertly crafted with natural movement and comfortable fit. This versatile piece is perfect for any occasion.`,
    
    // Name at end with confidence
    `Superior craftsmanship and premium materials create natural-looking beauty. This comfortable piece offers versatile styling. Boost your confidence with ${name}.`,
    
    // Name appears twice - elegance theme
    `Elegance and quality combine in ${name}. Expertly designed for natural movement and realistic appearance. Discover stunning beauty with ${name}.`,
    
    // Name in middle with premium
    `Premium hair quality is here. ${name} features expert craftsmanship, natural texture, and comfortable wear for stunning, versatile everyday style.`,
    
    // Name only once - natural focus
    `Natural beauty meets premium quality in this expertly designed piece. ${name} offers realistic appearance, comfortable fit, and effortless styling options.`
  ]
  
  // Select a random description from the array
  const randomIndex = Math.floor(Math.random() * descriptions.length)
  return descriptions[randomIndex]
}
