import CoreImage
import CoreImage.CIFilterBuiltins
import ImageIO
import Foundation

let output = CommandLine.arguments[1]
let filter = CIFilter.qrCodeGenerator()
filter.message = Data("https://joeundesign.com".utf8)
filter.correctionLevel = "M"
guard let image = filter.outputImage else { fatalError("QR generation failed") }
let scaled = image.transformed(by: CGAffineTransform(scaleX: 12, y: 12))
let context = CIContext(options: [.useSoftwareRenderer: true])
guard let cgImage = context.createCGImage(scaled, from: scaled.extent.integral) else { fatalError("QR rendering failed") }
guard let destination = CGImageDestinationCreateWithURL(URL(fileURLWithPath: output) as CFURL, "public.png" as CFString, 1, nil) else { fatalError("PNG destination failed") }
CGImageDestinationAddImage(destination, cgImage, nil)
guard CGImageDestinationFinalize(destination) else { fatalError("PNG write failed") }
