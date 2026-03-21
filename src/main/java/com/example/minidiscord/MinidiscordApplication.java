package com.example.minidiscord;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@SpringBootApplication
public class MinidiscordApplication {

	public static void main(String[] args) {
		SpringApplication.run(MinidiscordApplication.class, args);
	}

}

@Component
class ApplicationStartupListener {
	private final Environment environment;
	
	public ApplicationStartupListener(Environment environment) {
		this.environment = environment;
	}
	
	@EventListener(ApplicationReadyEvent.class)
	public void onApplicationReady() {
		String port = environment.getProperty("server.port", "8080");
		System.out.println("\n========================================");
		System.out.println("✅ MiniDiscord đang chạy!");
		System.out.println("🌐 Truy cập tại: http://localhost:" + port);
		System.out.println("========================================\n");
	}
}

