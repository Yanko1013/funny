use std::time::Instant;

fn main() {
    let n = 35;

    // 开始计时
    let start = Instant::now();

    let result = fibonacci(n);

    // 计算耗时
    let duration = start.elapsed();

    println!("rust: {:?} ms", duration.as_millis());
}

fn fibonacci(n: u32) -> u64 {
    if n <= 1 {
        return n as u64;
    }
    fibonacci(n - 1) + fibonacci(n - 2)
}
